export const DEFAULT_TEAM_COLORS = ["red", "black", "white"];

export const TEAM_COLOR_OPTIONS = {
  red: { label: "Red", kit: "#bb4545", ink: "#fff" },
  black: { label: "Black", kit: "#27312e", ink: "#fff" },
  white: { label: "White", kit: "#f7f8f4", ink: "#213329" },
  blue: { label: "Blue", kit: "#427da1", ink: "#fff" },
  yellow: { label: "Yellow", kit: "#f1c850", ink: "#243026" },
  green: { label: "Green", kit: "#387a55", ink: "#fff" },
};

export function groupTeamColors(overrides, groupId) {
  return overrides?.[groupId] || DEFAULT_TEAM_COLORS;
}

export function chooseTeamColor(overrides, groupId, index, color) {
  const previous = groupTeamColors(overrides, groupId);
  if (!TEAM_COLOR_OPTIONS[color] || !Number.isInteger(index) || index < 0 || index >= previous.length
    || (previous.includes(color) && previous[index] !== color)) return overrides;
  return { ...overrides, [groupId]: previous.map((item, itemIndex) => itemIndex === index ? color : item) };
}
