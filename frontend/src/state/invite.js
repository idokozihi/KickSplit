const PENDING_INVITE_KEY = "kicksplit-pending-invite";

function browserSessionStorage() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function invitePath(token) {
  return `/join/${encodeURIComponent(token)}`;
}

export function inviteUrl(token, origin) {
  return `${origin}${invitePath(token)}`;
}

export function pendingInvite(pathname) {
  return /^\/join\/[^/?#]+$/.test(pathname || "") ? pathname : null;
}

export function storePendingInvite(pathname, storage = browserSessionStorage()) {
  const invite = pendingInvite(pathname);
  if (!invite) return null;

  try {
    storage?.setItem(PENDING_INVITE_KEY, invite);
  } catch {
    // Router state remains available when storage is blocked by the browser.
  }
  return invite;
}

export function getPendingInvite(storage = browserSessionStorage()) {
  try {
    const invite = pendingInvite(storage?.getItem(PENDING_INVITE_KEY));
    if (!invite) storage?.removeItem(PENDING_INVITE_KEY);
    return invite;
  } catch {
    return null;
  }
}

export function clearPendingInvite(storage = browserSessionStorage()) {
  try {
    storage?.removeItem(PENDING_INVITE_KEY);
  } catch {
    // A blocked storage implementation has nothing usable to clear.
  }
}

function inviteDestination(from, storage) {
  return pendingInvite(from) || getPendingInvite(storage) || "/home";
}

export function destinationAfterAuth(from, signup = false, storage = browserSessionStorage()) {
  return signup ? "/profile-setup" : inviteDestination(from, storage);
}

export function destinationAfterProfileSetup(from, storage = browserSessionStorage()) {
  return inviteDestination(from, storage);
}

export async function joinInvitedGroup(addGroup, navigate, inviteToken, ratings, storage = browserSessionStorage()) {
  const group = await addGroup({ inviteToken, ratings });
  clearPendingInvite(storage);
  navigate(`/groups/${group.id}`, { replace: true });
  return group;
}
