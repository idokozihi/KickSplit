import { useState } from "react";
import { MockContext } from "./context";
import { initialState, createProposedDay, respondToDay, gameDays } from "./mock";

export default function MockProvider({ children }) {
  const [data, setData] = useState(initialState);
  const updateUser = (updates) =>
    setData((current) => ({
      ...current,
      user: { ...current.user, ...updates },
    }));
  const login = (email) => {
    const demo = initialState();
    setData({ ...demo, user: { ...demo.user, email } });
  };
  const register = (name, email) =>
    setData({
      user: { name, email, username: "", photo: "" },
      groups: [],
      games: [],
    });
  const addGroup = (group) =>
    setData((current) => ({ ...current, groups: [...current.groups, group] }));
  const updateRatings = (id, ratings) =>
    setData((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === id ? { ...group, ratings } : group,
      ),
    }));
  const addGame = (game) =>
    setData((current) => ({ ...current, games: [...current.games, game] }));
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
      games: current.games.map((game) => game.id === gameId
        ? { ...game, proposedDays: [...gameDays(game), createProposedDay(date, current.user)] }
        : game),
    }));
  const setAvailability = (gameId, dayId, response) =>
    setData((current) => ({
      ...current,
      games: current.games.map((game) => game.id === gameId
        ? respondToDay(game, dayId, "me", response) : game),
    }));
  return (
    <MockContext.Provider
      value={{
        ...data,
        updateUser,
        login,
        register,
        addGroup,
        updateRatings,
        addGame,
        updateGame,
        proposeDay,
        setAvailability,
      }}
    >
      {children}
    </MockContext.Provider>
  );
}
