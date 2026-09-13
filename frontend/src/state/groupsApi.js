async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, options);
  if (!response.ok) {
    throw new Error(`Could not ${options.method === "POST" ? "save" : "load"} group data (${response.status}). Please try again.`);
  }
  return response.json();
}

function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function mapGroup(dto) {
  return {
    id: String(dto.id),
    name: dto.name,
    image: dto.imageUrl || "",
    initials: dto.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(),
    color: "green",
    description: "Your crew. Your game.",
    // The Groups DTO does not expose membership or player ratings.
    members: [],
    ratings: {},
    detailsUnavailable: true,
  };
}

export async function loadGroups(signal) {
  return (await request("/groups", { signal })).map(mapGroup);
}

const pendingUsers = new Map();

export function resolveBackendUser(user) {
  // Multiple game cards (and StrictMode) can resolve the same profile at once.
  if (!pendingUsers.has(user.email)) {
    pendingUsers.set(user.email, findOrCreateUser(user).finally(() => pendingUsers.delete(user.email)));
  }
  return pendingUsers.get(user.email);
}

async function findOrCreateUser(user) {
  // The current frontend login is a demo profile, not a backend user session.
  const users = await request("/users");
  let creator = users.find((item) => item.email === user.email);
  if (!creator) {
    creator = await post("/users", {
      name: user.name,
      username: user.username,
      email: user.email,
      imageUrl: user.photo || null,
    });
  }
  return creator;
}

export async function saveGroup({ name, image, ratings, inviteToken }, user) {
  const creator = await resolveBackendUser(user);
  const selfRatings = {
    selfOverallRating: ratings.overall,
    selfAttackRating: ratings.attack,
    selfDefenseRating: ratings.defense,
  };
  const dto = inviteToken
    ? await post(`/groups/join/${encodeURIComponent(inviteToken)}`, { userId: creator.id, ...selfRatings })
    : await post("/groups", { name, imageUrl: image || null, creatorUserId: creator.id, ...selfRatings });
  return mapGroup(dto);
}
