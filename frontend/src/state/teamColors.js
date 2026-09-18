export const DEFAULT_TEAM_COLORS = ["red", "black", "white"];

export const TEAM_COLOR_OPTIONS = {
  red: { label: "Red", kit: "#bb4545", ink: "#fff" },
  black: { label: "Black", kit: "#27312e", ink: "#fff" },
  white: { label: "White", kit: "#f7f8f4", ink: "#213329" },
  blue: { label: "Blue", kit: "#427da1", ink: "#fff" },
  yellow: { label: "Yellow", kit: "#f1c850", ink: "#243026" },
  green: { label: "Green", kit: "#387a55", ink: "#fff" },
};

export function groupTeamColors(group) {
  return group?.teamColors || DEFAULT_TEAM_COLORS;
}

export function colorsFromGroupDto(dto) {
  const colors = [dto.team1Color, dto.team2Color, dto.team3Color].map((value) => value?.toLowerCase());
  return validTeamColors(colors) ? colors : [...DEFAULT_TEAM_COLORS];
}

export function validTeamColors(colors) {
  return Array.isArray(colors) && colors.length === 3 && new Set(colors).size === 3
    && colors.every((color) => Object.hasOwn(TEAM_COLOR_OPTIONS, color));
}

export function changedTeamColor(colors, index, color) {
  if (!Number.isInteger(index) || index < 0 || index >= colors.length) return null;
  const next = colors.map((current, currentIndex) => currentIndex === index ? color : current);
  return validTeamColors(next) ? next : null;
}
