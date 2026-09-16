import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { availableCount, gameDays, participantCount, rankedDays, rankedDaysByGroup } from "./mock.js";

const source = readFileSync(new URL("../components/UI.jsx", import.meta.url), "utf8");
const start = source.indexOf("  useEffect(() => {", source.indexOf("export function GameCard"));
const effect = source.slice(start, source.indexOf("  const guestsLoading", start));

test("Games cards fetch missing backend guests but skip loaded guests and demo games", () => {
  for (const [backendBacked, guestsLoaded, expected] of [[true, false, 1], [true, true, 0], [false, false, 0]]) {
    const requests = [];
    runInNewContext(effect, {
      game: { id: "42", backendBacked, guestsLoaded }, loadGuestList: true,
      guestKey: "42:0", AbortController,
      useEffect: (callback) => callback(),
      refreshGuests: async (id) => { requests.push(id); },
      setGuestError: () => assert.fail("Unexpected failure"),
    });
    assert.equal(requests.length, expected);
  }
});

test("participants include only AVAILABLE members and guests", () => {
  const day = {
    availability: { me: "AVAILABLE", a: "AVAILABLE", b: "UNAVAILABLE", c: null },
    guests: [{ id: "guest-1" }, { id: "guest-2" }],
  };
  assert.equal(availableCount(day), 2);
  assert.equal(participantCount(day), 4);
  assert.equal(participantCount({ ...day, guests: [] }), 2);
  assert.equal(participantCount({ availability: { a: "UNAVAILABLE", b: null }, guests: [] }), 0);
});

test("Home and Games day selections have the same participant count without changing popularity ranking", () => {
  const game = {
    id: "42", groupId: "7", date: "2026-09-18", rsvp: "GOING",
    participants: [{ id: "8", status: "NOT_GOING" }, { id: "9", status: "MAYBE" }],
    guests: [{ id: "guest-1" }, { id: "guest-2" }],
  };
  const homeDay = rankedDays([game])[0].day;
  const gamesDay = rankedDaysByGroup([game])[0].day;
  assert.equal(participantCount(homeDay), 3);
  assert.equal(participantCount(gamesDay), 3);
  assert.deepEqual(gameDays(game)[0].availability, { me: "AVAILABLE", 8: "UNAVAILABLE" });
  const other = { ...game, id: "43", guests: [], participants: [{ id: "8", status: "GOING" }] };
  assert.equal(rankedDaysByGroup([game, other])[0].game.id, "43");
});
