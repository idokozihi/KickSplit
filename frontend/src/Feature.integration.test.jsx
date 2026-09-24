import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CreateGameForm } from "./components/Forms";
import Game from "./pages/Game";
import Group from "./pages/Group";
import MockProvider from "./state/MockProvider";
import { MockContext, useApp } from "./state/context";

const user = {
  id: 7,
  name: "Test Admin",
  username: "test_admin",
  email: "admin@example.com",
  photo: "",
};

const group = {
  id: "42",
  name: "Friday FC",
  image: "",
  description: "Your crew. Your game.",
  ratingSource: "APP_RATING",
  teamColors: ["red", "black", "white"],
  teamGenerationPermission: "PLAYERS",
  teamRegenerationMode: "PLAYER_VOTE",
  resultEntryPermission: "PLAYERS",
};

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderRoute(path, element, value) {
  const routePath = path.startsWith("/groups/") ? "/groups/:groupId" : "/games/:gameId";
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MockContext.Provider value={value}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MockContext.Provider>
    </MemoryRouter>,
  );
}

function GroupImageStateHarness() {
  const { groups, updateGroupImage } = useApp();
  const current = groups.find((item) => item.id === "42");
  return <>
    <output data-testid="group-image-state">{current?.image || "No photo"}</output>
    <button disabled={!current} onClick={() => updateGroupImage("42", "data:image/jpeg;base64,updated")}>Update photo</button>
  </>;
}

beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function close() {
    this.removeAttribute("open");
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("feature integration", () => {
  test("a saved group photo immediately updates shared provider state", async () => {
    sessionStorage.setItem("kicksplit-profile", JSON.stringify(user));
    vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
      if (url === "/api/groups/user/7") return jsonResponse([{ id: 42, name: "Friday FC", imageUrl: null }]);
      if (url === "/api/games/group/42") return jsonResponse([]);
      if (url === "/api/groups/42/image" && options.method === "PATCH") {
        return jsonResponse({ id: 42, name: "Friday FC", imageUrl: "data:image/jpeg;base64,updated" });
      }
      throw new Error(`Unexpected request: ${options.method || "GET"} ${url}`);
    }));

    render(<MockProvider><GroupImageStateHarness /></MockProvider>);

    const button = await screen.findByRole("button", { name: "Update photo" });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByTestId("group-image-state").textContent).toBe("data:image/jpeg;base64,updated"));
  });

  test("a non-admin group member can remove the group photo from settings", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (url === "/api/groups/42") return jsonResponse({ id: 42, name: "Friday FC", imageUrl: "data:image/jpeg;base64,current" });
      if (url === "/api/groups/42/members") return jsonResponse([{ userId: 7, name: "Test Admin", admin: false }]);
      throw new Error(`Unexpected request: GET ${url}`);
    }));
    const updateGroupImage = vi.fn(async () => ({ ...group, image: "" }));

    renderRoute("/groups/42", <Group />, {
      user,
      groups: [{ ...group, image: "data:image/jpeg;base64,current" }],
      games: [],
      groupsLoading: false,
      groupsError: "",
      updateGroupDetails: vi.fn(),
      updateGroupImage,
      leaveGroup: vi.fn(),
    });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove photo" }));
    await waitFor(() => expect(updateGroupImage).toHaveBeenCalledWith("42", null));
  });

  test("game creation carries the authenticated user through the form and provider", async () => {
    sessionStorage.setItem("kicksplit-profile", JSON.stringify(user));
    const requests = [];
    vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
      requests.push({ url, options });
      if (url === "/api/groups/user/7") return jsonResponse([{ id: 42, name: "Friday FC" }]);
      if (url === "/api/games/group/42") return jsonResponse([]);
      if (url === "/api/games" && options.method === "POST") return jsonResponse({
        id: 81,
        groupId: 42,
        groupName: "Friday FC",
        createdByUserId: 7,
        name: "Friday football",
        date: "2026-10-02",
        time: null,
        targetPlayers: 15,
      });
      throw new Error(`Unexpected request: ${options.method || "GET"} ${url}`);
    }));
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <MockProvider>
          <CreateGameForm groupId="42" date="2026-10-02" onClose={onClose} />
        </MockProvider>
      </MemoryRouter>,
    );

    fireEvent.submit(screen.getByRole("button", { name: /Create game/ }).closest("form"));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());

    const request = requests.find(({ url, options }) => url === "/api/games" && options.method === "POST");
    expect(JSON.parse(request.options.body)).toEqual({
      groupId: 42,
      userId: 7,
      name: "Friday football",
      date: "2026-10-02",
      time: null,
      targetPlayers: 15,
    });
  });

  test("members remain usable when the unrelated group detail refresh fails", async () => {
    const calls = [];
    vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
      calls.push({ url, options });
      if (url === "/api/groups/42") return jsonResponse({}, 500);
      if (url === "/api/groups/42/members") return jsonResponse([
        { userId: 7, name: "Test Admin", admin: true, selfOverallRating: 3, selfAttackRating: 3, selfDefenseRating: 2, appRating: 3, ratedGames: 0, totalWins: 0, totalRecordedWins: 0, winRate: 0 },
        { userId: 9, name: "Other Member", admin: false, selfOverallRating: 4, selfAttackRating: 4, selfDefenseRating: 3, appRating: 4, ratedGames: 0, totalWins: 0, totalRecordedWins: 0, winRate: 0 },
      ]);
      if (url === "/api/groups/42/self-rating" && options.method === "PATCH") {
        return jsonResponse({ userId: 7, name: "Test Admin", admin: true, selfOverallRating: 5, selfAttackRating: 4, selfDefenseRating: 2, appRating: 5, ratedGames: 0, totalWins: 0, totalRecordedWins: 0, winRate: 0 });
      }
      throw new Error(`Unexpected request: ${options.method || "GET"} ${url}`);
    }));

    renderRoute("/groups/42", <Group />, {
      user,
      groups: [group],
      games: [],
      groupsLoading: false,
      groupsError: "",
      updateGroupDetails: vi.fn(),
      leaveGroup: vi.fn(),
    });

    const editButton = await screen.findByRole("button", { name: "Edit rating" });
    expect(editButton.disabled).toBe(false);
    expect(await screen.findByRole("button", { name: "Remove member" })).toBeTruthy();

    fireEvent.click(editButton);
    fireEvent.click(screen.getByRole("button", { name: "overall: 5 out of 5" }));
    fireEvent.click(screen.getByRole("button", { name: "attack: 4 out of 5" }));
    fireEvent.click(screen.getByRole("button", { name: "defense: 2 out of 5" }));
    fireEvent.submit(screen.getByRole("button", { name: "Save rating" }).closest("form"));

    await waitFor(() => expect(calls.some(({ url, options }) =>
      url === "/api/groups/42/self-rating"
      && JSON.stringify(JSON.parse(options.body)) === JSON.stringify({
        userId: 7,
        selfOverallRating: 5,
        selfAttackRating: 4,
        selfDefenseRating: 2,
      }))).toBe(true));
  });

  test("the creator can reach Delete game from the default game view", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => url === "/api/groups/42/members"
      ? jsonResponse([{ userId: 7, name: "Test Admin", admin: false }])
      : jsonResponse([])));
    const game = {
      backendBacked: true,
      id: "81",
      groupId: "42",
      groupName: "Friday FC",
      title: "Friday football",
      date: "2026-10-02",
      time: null,
      target: 15,
      createdByUserId: 7,
      rsvp: null,
      participants: [],
      guests: [],
    };

    renderRoute("/games/81", <Game />, {
      user,
      groups: [group],
      games: [game],
      updateGame: vi.fn(),
      deleteGame: vi.fn(),
      cacheGame: vi.fn(),
      refreshRegistrations: vi.fn(async () => {}),
      refreshGuests: vi.fn(async () => {}),
      addBackendGuest: vi.fn(),
    });

    expect(screen.getByRole("button", { name: "Delete game" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lineup" }).getAttribute("aria-pressed")).toBe("true");
  });

  test("an admin can reach Delete game for a legacy game with no creator", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => url === "/api/groups/42/members"
      ? jsonResponse([{ userId: 7, name: "Test Admin", admin: true }])
      : jsonResponse([])));
    const legacyGame = {
      backendBacked: true,
      id: "82",
      groupId: "42",
      groupName: "Friday FC",
      title: "Legacy game",
      date: "2026-10-03",
      time: null,
      target: 12,
      createdByUserId: null,
      rsvp: null,
      participants: [],
      guests: [],
    };

    renderRoute("/games/82", <Game />, {
      user,
      groups: [group],
      games: [legacyGame],
      updateGame: vi.fn(),
      deleteGame: vi.fn(),
      cacheGame: vi.fn(),
      refreshRegistrations: vi.fn(async () => {}),
      refreshGuests: vi.fn(async () => {}),
      addBackendGuest: vi.fn(),
    });

    expect(await screen.findByRole("button", { name: "Delete game" })).toBeTruthy();
  });
});
