import { useApp } from "../state/context";
import { rankedDaysByGroup } from "../state/mock";
import {
  EmptyState,
  GameCard,
  Icon,
  PageHeading,
  Section,
} from "../components/UI";

export default function Games() {
  const { games } = useApp();
  const scheduled = rankedDaysByGroup(games);
  return (
    <>
      <PageHeading
        eyebrow="MAKE TIME FOR THE GAME"
        title="Your games"
        subtitle="Find a day to play across your groups."
      />
      <Section
        title={`Proposed days${scheduled.length ? ` · ${scheduled.length}` : ""}`}
      >
        {scheduled.length ? (
          <div className="cards-grid">
            {scheduled.map(({ game, day, popular }) => (
              <GameCard game={game} day={day} popular={popular} key={`${game.id}-${day.id}`} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="An open calendar, for now"
            description="Join a group or create a game from your group page."
            to="/groups"
            action="Go to groups"
          />
        )}
      </Section>
      <Section title="Past games">
        <div className="quiet-state">
          <Icon name="clock" />
          <div>
            <h3>For the games already played</h3>
            <p>A place for past games is coming in a future update.</p>
          </div>
          <span className="badge neutral">Coming later</span>
        </div>
      </Section>
    </>
  );
}
