import { Link } from "react-router-dom";
import { useApp } from "../state/context";
import { upcoming } from "../state/mock";
import {
  EmptyState,
  GameCard,
  GroupCard,
  Icon,
  PageHeading,
  Section,
} from "../components/UI";

export default function Home() {
  const { user, groups, games } = useApp();
  const scheduled = upcoming(games);
  const waiting = scheduled.filter((game) => !game.rsvp);
  return (
    <>
      <PageHeading
        eyebrow="YOUR FOOTBALL, TOGETHER"
        title={`Hey, ${user.name.split(" ")[0]}.`}
        subtitle="A little less organising. A lot more football."
        action={
          <span className="date-chip">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        }
      />
      <div className="home-grid">
        <div>
          {scheduled[0] ? (
            <GameCard game={scheduled[0]} featured />
          ) : (
            <EmptyState
              title="Your next game starts with a group"
              description="Join your football crew or create a group to get the ball rolling."
              to="/groups"
              action="Find your crew"
            />
          )}
          <Section
            title="Waiting on your RSVP"
            link={waiting.length ? { to: "/games", label: "All games" } : null}
          >
            {waiting.length ? (
              <div className="card-list">
                {waiting.slice(0, 2).map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="quiet-state">
                <Icon name="check" />
                <div>
                  <h3>
                    {groups.length
                      ? "You’re all caught up"
                      : "No invitations yet"}
                  </h3>
                  <p>
                    {groups.length
                      ? "We’ll keep your upcoming games here."
                      : "Your game invitations will appear here once you join a group."}
                  </p>
                </div>
              </div>
            )}
          </Section>
        </div>
        <aside>
          <Section
            title="Your groups"
            link={{ to: "/groups", label: "View all" }}
          >
            {groups.length ? (
              <div className="card-list">
                {groups.slice(0, 3).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Every game needs a crew"
                description="Your groups will feel right at home here."
                to="/groups"
                action="Explore groups"
              />
            )}
          </Section>
          <div className="play-note">
            <Icon name="ball" size={32} />
            <h2>
              Same crew.
              <br />
              New game.
            </h2>
            <p>Keep the weekly tradition going.</p>
            <Link className="text-link" to="/groups">
              Get your group together
              <Icon name="arrow" size={17} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
