import { useParams } from "react-router-dom";
import { useApp } from "../state/context";
import { goingPlayers, makeProposals } from "../state/mock";
import { Avatar, BackLink, EmptyState, PageHeading } from "../components/UI";

export default function TeamProposals() {
  const { gameId } = useParams();
  const { games, groups, user } = useApp();
  const game = games.find((item) => item.id === gameId);
  if (!game)
    return (
      <EmptyState
        title="Game not found"
        description="Choose a game from your current session."
        to="/games"
        action="Your games"
      />
    );
  const players = goingPlayers(game, user);
  if (players.length < 3)
    return (
      <EmptyState
        title="A few more players first"
        description="At least 3 confirmed players, including guests, are needed for one player on each team."
        to={`/games/${gameId}`}
        action="Back to game"
      />
    );
  const proposals = makeProposals(players);
  const group = groups.find((item) => item.id === game.groupId);
  return (
    <>
      <BackLink to={`/games/${gameId}`}>Back to game</BackLink>
      <PageHeading
        eyebrow={group.name}
        title="Three ways to play."
        subtitle={`${game.title} · ${players.length} confirmed players, including guests`}
      />
      <p className="proposal-intro">
        {players.length === 3
          ? "With three players, each team has one player. Proposals vary which numbered team each player joins."
          : "Same players. Three different lineups. Take a look and find your match."}
      </p>
      <div className="proposals">
        {proposals.map((teams, index) => (
          <section className="proposal" key={index}>
            <header className="proposal-heading">
              <span className="proposal-number">0{index + 1}</span>
              <div>
                <h2>Proposal {index + 1}</h2>
                <p>
                  {
                    [
                      "The first lineup",
                      "A fresh combination",
                      "One more possibility",
                    ][index]
                  }
                </p>
              </div>
              <span className="badge neutral">3 teams</span>
            </header>
            <div className="team-grid">
              {teams.map((team, teamIndex) => (
                <div className={`team team-${teamIndex}`} key={teamIndex}>
                  <div className="section-heading">
                    <h3>Team {teamIndex + 1}</h3>
                    <span>{team.length} players</span>
                  </div>
                  {team.map((player) => (
                    <div className="person" key={player.id}>
                      <Avatar
                        name={player.name}
                        photo={player.id === "me" ? user.photo : undefined}
                      />
                      <span>
                        {player.name}
                        {(player.guest || player.id === "me") && (
                          <small>{player.guest ? "Guest" : "You"}</small>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="form-hint">
        Beta preview · Example lineups only. Skill-based balancing is not
        connected yet.
      </p>
    </>
  );
}
