import { useEffect, useState } from "react";
import { resolveBackendUser } from "./groupsApi.js";
import { loadVotes, saveVote, mergeVote } from "./votesApi.js";

export function useVotes(gameId, user, enabled) {
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const key = `${gameId}:${user.id}:${user.email}:${retry}`;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    Promise.all([loadVotes(gameId, controller.signal), resolveBackendUser(user)])
      .then(([votes, backendUser]) => {
        if (!controller.signal.aborted) setResult({ key, votes, userId: backendUser.id, controller });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, error: error.message });
      });
    return () => controller.abort();
  }, [gameId, user, enabled, key]);

  const current = result?.key === key ? result : null;
  async function vote(proposalId) {
    if (!current?.votes || current.controller.signal.aborted || current.controller.saving) return;
    const { controller } = current;
    controller.saving = true;
    setResult((previous) => ({ ...previous, saving: true, saveError: null }));
    try {
      const saved = await saveVote(gameId, current.userId, proposalId, controller.signal);
      if (!controller.signal.aborted) setResult((previous) => ({ ...previous, votes: mergeVote(previous.votes, saved), saving: false }));
    } catch (error) {
      if (!controller.signal.aborted) setResult((previous) => ({ ...previous, saveError: error.message, saving: false }));
    } finally {
      controller.saving = false;
    }
  }
  return { ...current, loading: enabled && !current, vote, retry: () => setRetry((value) => value + 1),
    resetVotes: () => setResult((previous) => previous?.key === key ? { ...previous, votes: [], saveError: null } : previous) };
}
