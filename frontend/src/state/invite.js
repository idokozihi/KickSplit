export function invitePath(token) {
  return `/join/${encodeURIComponent(token)}`;
}

export function inviteUrl(token, origin) {
  return `${origin}${invitePath(token)}`;
}

export function pendingInvite(pathname) {
  return /^\/join\/[^/]+$/.test(pathname || "") ? pathname : null;
}

export function destinationAfterAuth(from, signup = false) {
  return signup ? "/profile-setup" : pendingInvite(from) || "/home";
}

export async function joinInvitedGroup(addGroup, navigate, inviteToken, ratings) {
  const group = await addGroup({ inviteToken, ratings });
  navigate(`/groups/${group.id}`, { replace: true });
  return group;
}
