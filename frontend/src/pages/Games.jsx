import { useApp } from "../state/context";
import { upcoming } from "../state/mock";
import {
  EmptyState,
  GameCard,
  Icon,
  PageHeading,
  Section,
} from "../components/UI";

export default function Games() {
  const { games } = useApp();
  const scheduled = upcoming(games);
  return (
    <>
      <PageHeading
        eyebrow="MAKE TIME FOR THE GAME"
        title="Your games"
        subtitle="Every group. Every upcoming kickoff."
      />
      <Section
        title={`Upcoming games${scheduled.length ? ` · ${scheduled.length}` : ""}`}
      >
        {scheduled.length ? (
          <div className="cards-grid">
            {scheduled.map((game) => (
              <GameCard game={game} key={game.id} />
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
