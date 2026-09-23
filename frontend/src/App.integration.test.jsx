import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "./App";
import { MockContext } from "./state/context";

const authenticatedUser = {
  id: 7,
  name: "Test Player",
  username: "",
  email: "player@example.com",
  photo: "",
};

function LocationProbe({ visits }) {
  const location = useLocation();
  visits.push(location.pathname);
  return <output data-testid="location">{location.pathname}</output>;
}

function AuthTestProvider({ children }) {
  const [user, setUser] = useState(null);

  async function authenticate(overrides = {}) {
    const nextUser = { ...authenticatedUser, ...overrides };
    setUser(nextUser);
    return nextUser;
  }

  return (
    <MockContext.Provider
      value={{
        user,
        groups: [],
        games: [],
        login: (email) => authenticate({ email }),
        register: (name, email) => authenticate({ name, email }),
        updateUser: (updates) => authenticate(updates),
        addGroup: async () => ({ id: 42 }),
      }}
    >
      {children}
    </MockContext.Provider>
  );
}

function renderInviteFlow() {
  const visits = [];
  render(
    <MemoryRouter initialEntries={["/join/test-token"]}>
      <AuthTestProvider>
        <App />
        <LocationProbe visits={visits} />
      </AuthTestProvider>
    </MemoryRouter>,
  );
  return visits;
}

function fillLoginFields() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "player@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
}

beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("invite authentication routing", () => {
  test("signup stays out of /home and continues through profile setup to the invite", async () => {
    const visits = renderInviteFlow();

    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Test Player" } });
    fillLoginFields();
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "secret12" } });
    fireEvent.submit(screen.getByRole("button", { name: /Create account/ }).closest("form"));

    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/profile-setup"));
    expect(visits).not.toContain("/home");

    fireEvent.change(screen.getByPlaceholderText("yourname"), { target: { value: "test_player" } });
    fireEvent.submit(screen.getByRole("button", { name: /Continue/ }).closest("form"));

    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/join/test-token"));
    expect(visits).not.toContain("/home");
    expect(screen.getByRole("heading", { name: "Join a group" })).toBeTruthy();
    expect(screen.getByText("Your ratings in this group")).toBeTruthy();
  });

  test("existing-user login stays out of /home and returns directly to the invite", async () => {
    const visits = renderInviteFlow();

    await screen.findByRole("heading", { name: "Welcome back" });
    fillLoginFields();
    fireEvent.submit(screen.getByRole("button", { name: /Continue with email/ }).closest("form"));

    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/join/test-token"));
    expect(visits).not.toContain("/home");
    expect(screen.getByRole("heading", { name: "Join a group" })).toBeTruthy();
  });
});
