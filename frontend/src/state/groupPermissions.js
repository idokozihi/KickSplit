export const DEFAULT_GROUP_PERMISSIONS = {
  teamGenerationPermission: "PLAYERS",
  teamRegenerationMode: "PLAYER_VOTE",
  resultEntryPermission: "PLAYERS",
};

export function permissionsFromGroup(group = {}) {
  return {
    teamGenerationPermission: group.teamGenerationPermission || DEFAULT_GROUP_PERMISSIONS.teamGenerationPermission,
    teamRegenerationMode: group.teamRegenerationMode || DEFAULT_GROUP_PERMISSIONS.teamRegenerationMode,
    resultEntryPermission: group.resultEntryPermission || DEFAULT_GROUP_PERMISSIONS.resultEntryPermission,
  };
}

export function teamGenerationAccess({ isAdmin, isMember, registrationStatus, permission }) {
  if (isAdmin) return { allowed: true, message: "" };
  if (permission === "ADMINS_ONLY") {
    return { allowed: false, message: "Only group admins can generate teams." };
  }
  if (isMember && registrationStatus === "AVAILABLE") {
    return { allowed: true, message: "" };
  }
  return { allowed: false, message: "Only registered, available players can generate teams." };
}

export function gameResultAccess({
  isAdmin,
  isMember,
  registrationStatus,
  permission,
  result,
  userId,
}) {
  if (isAdmin) return { allowed: true, message: "" };
  if (permission === "ADMINS_ONLY") {
    return { allowed: false, message: "Only group admins can enter or edit game results." };
  }
  if (result) {
    return String(result.enteredByUserId) === String(userId) && isMember
      ? { allowed: true, message: "" }
      : { allowed: false, message: "Only the player who entered this result or a group admin can edit it." };
  }
  return isMember && registrationStatus === "AVAILABLE"
    ? { allowed: true, message: "" }
    : { allowed: false, message: "Only registered, available players can enter the first result." };
}
