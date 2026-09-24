export function mergeUpdatedGroup(groups, savedGroup) {
  return groups.map((group) => group.id === savedGroup.id
    ? {
      ...group,
      ...savedGroup,
      members: group.members,
      ratings: group.ratings,
    }
    : group);
}
