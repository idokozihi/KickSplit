import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { availableCount, gameDays, rankedDaysByGroup } from "./mock.js";

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

test("participant count includes guests without changing availability-based group ranking", () => {
  const game = { id: "42", groupId: "7", date: "2026-09-18", rsvp: "GOING", participants: [], guests: [{ id: "1" }] };
  const day = gameDays(game)[0];
  const countExpression = source.match(/const count = (.*);/)[1];
  assert.equal(runInNewContext(countExpression, { day, showParticipants: true, availableCount }), 2);
  assert.equal(runInNewContext(countExpression, { day, showParticipants: false, availableCount }), 1);
  const other = { ...game, id: "43", guests: [], participants: [{ id: "8", status: "GOING" }] };
  assert.equal(rankedDaysByGroup([game, other])[0].game.id, "43");
});
