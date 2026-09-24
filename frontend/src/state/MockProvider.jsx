import { useCallback, useEffect, useRef, useState } from "react";
import { leaveGroup as leaveBackendGroup, loadGroups, saveGroup, resolveBackendUser, updateGroupImage as updateBackendGroupImage } from "./groupsApi";
import { loadRegistrations, saveRegistration, registrationState } from "./registrationsApi";
import { createGame, deleteGame as deleteBackendGame, loadGroupGames, mergeGames } from "./gamesApi";
import { loadGuests, saveGuest, mergeGuests } from "./guestsApi";
import { MockContext } from "./context";
import { initialState, stateForUser, createProposedDay, respondToDay, gameDays } from "./mock";
import { loginUser, registerUser } from "./authApi";
import { saveUserProfile } from "./usersApi";
import { mergeUpdatedGroup } from "./groupState";

export default function MockProvider({ children }) {
  const [data, setData] = useState(() => {
    const initial = { ...initialState({ includeDemoGames: !import.meta.env.PROD }), user: null, groups: [] };
    try {
      const profile = JSON.parse(sessionStorage.getItem("kicksplit-profile"));
      if (Number.isInteger(profile?.id) && profile.email) initial.user = profile;
    } catch { /* Start logged out when session storage is unavailable. */ }
    return initial;
  });
  const activeUserId = useRef(data.user?.id);
  useEffect(() => {
    try {
      if (data.user) sessionStorage.setItem("kicksplit-profile", JSON.stringify(data.user));
      else sessionStorage.removeItem("kicksplit-profile");
    }
    catch { /* The current session can still use the profile in memory. */ }
  }, [data.user]);
  const [groupsLoading, setGroupsLoading] = useState(Number.isInteger(data.user?.id));
  const [groupsError, setGroupsError] = useState("");
  const [gamesLoading, setGamesLoading] = useState(Number.isInteger(data.user?.id));
  const [gamesError, setGamesError] = useState("");
  const userId = data.user?.id;
  useEffect(() => {
    if (!Number.isInteger(userId)) return;
    const controller = new AbortController();
    loadGroups(userId, controller.signal)
      .then(async (groups) => {
        if (controller.signal.aborted) return;
        setData((current) => current.user?.id === userId ? {
          ...current,
          groups: [...groups.filter((group) => !current.groups.some((item) => item.id === group.id)), ...current.groups],
        } : current);
        setGroupsLoading(false);
        const results = await Promise.allSettled(groups.map((group) => loadGroupGames(group.id, controller.signal)));
        if (controller.signal.aborted) return;
        const loaded = results.filter((result) => result.status === "fulfilled").flatMap((result) => result.value);
        setData((current) => current.user?.id === userId
          ? { ...current, games: mergeGames(current.games, loaded) }
          : current);
        const failed = results.find((result) => result.status === "rejected");
        if (failed) setGamesError(failed.reason.message || "Could not load games. Please refresh to try again.");
      })
      .catch((error) => {
        if (!controller.signal.aborted) setGroupsError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setGroupsLoading(false);
          setGamesLoading(false);
        }
      });
    return () => controller.abort();
  }, [userId]);
  const setAuthenticatedUser = (user) => {
    activeUserId.current = user.id;
    if (data.user?.id !== user.id) {
      setGroupsLoading(true);
      setGamesLoading(true);
      setGroupsError("");
      setGamesError("");
    }
    setData((current) => stateForUser(current, user, !import.meta.env.PROD));
  };
  const updateUser = async (updates) => {
    const user = await saveUserProfile(data.user, updates);
    setAuthenticatedUser(user);
    return user;
  };
  const login = async (email, password) => {
    const user = await loginUser(email, password);
    setAuthenticatedUser(user);
    return user;
  };
  const register = async (name, email, password) => {
    const user = await registerUser(name, email, password);
    setAuthenticatedUser(user);
    return user;
  };
  const addGroup = async (input) => {
    const user = data.user;
    const group = await saveGroup(input, user);
    if (activeUserId.current !== user?.id) throw new Error("Your account changed. Please try again.");
    setData((current) => current.user?.id === user.id
      ? { ...current, groups: [...current.groups.filter((item) => item.id !== group.id), group] }
      : current);
    return group;
  };
  const updateRatings = (id, ratings) =>
    setData((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === id ? { ...group, ratings } : group,
      ),
    }));
  const updateGroupDetails = useCallback((saved) => {
    setData((current) => ({ ...current, groups: mergeUpdatedGroup(current.groups, saved) }));
  }, []);
  const updateGroupImage = async (groupId, imageUrl) => {
    const backendUser = await resolveBackendUser(data.user);
    const saved = await updateBackendGroupImage(groupId, backendUser.id, imageUrl);
    setData((current) => current.user?.id === backendUser.id
      ? { ...current, groups: mergeUpdatedGroup(current.groups, saved) }
      : current);
    return saved;
  };
  const addGame = async (input) => {
    const backendUser = await resolveBackendUser(data.user);
    const game = await createGame({ ...input, userId: backendUser.id });
    setData((current) => current.user?.id === backendUser.id
      ? { ...current, games: mergeGames(current.games, [game]) }
      : current);
    return game;
  };
  const deleteGame = async (gameId) => {
    const backendUser = await resolveBackendUser(data.user);
    await deleteBackendGame(gameId, backendUser.id);
    setData((current) => current.user?.id === backendUser.id
      ? { ...current, games: current.games.filter((game) => game.id !== String(gameId)) }
      : current);
  };
  const leaveGroup = async (groupId) => {
    const backendUser = await resolveBackendUser(data.user);
    await leaveBackendGroup(groupId, backendUser.id);
    setData((current) => current.user?.id === backendUser.id ? {
      ...current,
      groups: current.groups.filter((group) => group.id !== String(groupId)),
      games: current.games.filter((game) => game.groupId !== String(groupId)),
    } : current);
  };
  const cacheGame = useCallback((game) => {
    setData((current) => current.games.some((item) => item.id === game.id)
      ? current
      : { ...current, games: [...current.games, game] });
  }, []);
  const updateGame = (id, updates) =>
    setData((current) => ({
      ...current,
      games: current.games.map((game) =>
        game.id === id ? { ...game, ...updates } : game,
      ),
    }));
  const proposeDay = (gameId, date) =>
    setData((current) => ({
      ...current,
      games: current.games.map((game) => game.id === gameId && !game.backendBacked
        ? { ...game, proposedDays: [...gameDays(game), createProposedDay(date, current.user)] }
        : game),
    }));
  const refreshRegistrations = useCallback(async (gameId, signal) => {
    const [registrations, backendUser] = await Promise.all([
      loadRegistrations(gameId, signal), resolveBackendUser(data.user),
    ]);
    if (signal.aborted) return;
    setData((current) => current.user.email !== data.user.email ? current : ({
      ...current,
      games: current.games.map((game) => game.id === gameId
        ? { ...game, ...registrationState(registrations, backendUser.id), registrationsFor: data.user.email } : game),
    }));
  }, [data.user]);
  const refreshGuests = useCallback(async (gameId, signal) => {
    const guests = await loadGuests(gameId, signal);
    if (signal.aborted) return;
    setData((current) => ({
      ...current,
      games: current.games.map((game) => game.id === gameId
        ? { ...game, guests: mergeGuests(game.guests, guests), guestsLoaded: true } : game),
    }));
  }, []);
  const addBackendGuest = async (gameId, input) => {
    const backendUser = await resolveBackendUser(data.user);
    const guest = await saveGuest(gameId, input, backendUser.id);
    setData((current) => ({
      ...current,
      games: current.games.map((game) => game.id === gameId
        ? { ...game, guests: mergeGuests(game.guests, [guest]) } : game),
    }));
    return guest;
  };
  const setAvailability = async (gameId, dayId, response) => {
    if (data.games.find((game) => game.id === gameId)?.backendBacked) {
      const backendUser = await resolveBackendUser(data.user);
      const saved = await saveRegistration(gameId, backendUser.id, response);
      setData((current) => current.user.email !== data.user.email ? current : ({
        ...current,
        games: current.games.map((game) => {
          if (game.id !== gameId) return game;
          const registrations = [...(game.registrations || []).filter((item) => String(item.userId) !== String(saved.userId)), saved];
          return { ...game, ...registrationState(registrations, backendUser.id) };
        }),
      }));
      return;
    }
    setData((current) => ({
      ...current,
      games: current.games.map((game) => game.id === gameId
        ? respondToDay(game, dayId, "me", response) : game),
    }));
  };
  return (
    <MockContext.Provider
      value={{
        ...data,
        groupsLoading,
        groupsError,
        gamesLoading,
        gamesError,
        updateUser,
        login,
        register,
        addGroup,
        updateRatings,
        updateGroupDetails,
        updateGroupImage,
        addGame,
        deleteGame,
        leaveGroup,
        cacheGame,
        updateGame,
        proposeDay,
        setAvailability,
        refreshRegistrations,
        refreshGuests,
        addBackendGuest,
      }}
    >
      {children}
    </MockContext.Provider>
  );
}
