# KickSplit frontend beta

Run `npm install` and `npm run dev` from the frontend directory.

## Click-through guide

- Log in with any valid email and a password of at least six characters to explore a populated demo account.
- Switch to Sign up to start with an empty account, then complete the profile setup.
- Open Groups to create a group with an optional image or join Parkside Five using invite code **PARK5**. Both flows include overall, attack, and defense ratings for that membership.
- Open a group to edit its ratings or create a future game. The target can be any positive whole number, with no upper cap.
- Open a game to change RSVP, add a guest with a fixed rating from 1 to 5, and generate three team proposals. At least three confirmed players, including guests, are needed for one player per team.
- Open Profile to edit account details and optionally choose a profile image.

## Mock behavior

All data lives in React context for the current tab session. Refreshing resets the populated demo. There are no API calls, stored passwords, authentication libraries, or backend changes.

Dates are seeded relative to the current date. Upcoming games are sorted chronologically. Optional group images and profile photos use local file previews. Groups without an image keep the default crest.

Team proposals use three deterministic roster variations, each with three teams. They include every going player and guest exactly once and retain guest ratings for future integration. With exactly three players, only numbered team assignments can vary. This is a visual mock, not a skill balancing algorithm. Voting and game history are not implemented.

The existing routes and Home / Games / Groups / Profile navigation are preserved.

## Structure

- `src/state/`: mock fixtures, React context, session updates, and roster helpers.
- `src/components/UI.jsx`: shared cards, avatars, crests, headings, icons, and accessible dialogs.
- `src/components/Forms.jsx`: group setup, ratings, game creation, and profile forms.
- `src/pages/`: the existing nine route screens.
- `src/App.css`: responsive styles, including mobile bottom navigation.

## Checks

- `npm run build`
- `npm run lint`
- `node --test src/state/mock.test.js`
