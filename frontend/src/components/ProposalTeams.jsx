import { Avatar } from "./UI";

export default function ProposalTeams({ teams, user }) {
  return <div className="team-grid">
    {teams.map((team, teamIndex) => <div className={`team team-${teamIndex}`} key={teamIndex}>
      <div className="section-heading"><h3>{["Red", "Black", "White"][teamIndex]} team</h3><span>{team.length} players</span></div>
      {team.map((player, index) => <div className="person" key={`${player.id}-${index}`}>
        <Avatar name={player.name} photo={player.isCurrentUser || player.id === "me" ? user.photo : undefined} />
        <span>{player.name}{(player.guest || player.isCurrentUser || player.id === "me") &&
          <small>{player.guest ? "Guest" : "You"}</small>}</span>
      </div>)}
    </div>)}
  </div>;
}
