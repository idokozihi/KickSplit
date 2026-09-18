import { useRef, useState } from "react";
import { useApp } from "../state/context";
import { groupTeamColors, TEAM_COLOR_OPTIONS } from "../state/teamColors";

export default function ProposalTeams({ teams, groupId }) {
  const { groups } = useApp();
  const colors = groupTeamColors(groups.find((group) => group.id === String(groupId)));
  const [activeTeam, setActiveTeam] = useState(0);
  const track = useRef(null);

  function selectTeam(index) {
    setActiveTeam(index);
    const viewport = track.current;
    if (viewport) viewport.scrollTo({ left: viewport.clientWidth * index, behavior: "smooth" });
  }

  function updateActiveTeam(event) {
    const viewport = event.currentTarget;
    if (viewport.clientWidth) setActiveTeam(Math.round(viewport.scrollLeft / viewport.clientWidth));
  }

  return <div className="lineup-viewer">
    <div className="team-selector" role="group" aria-label="Teams in this proposal">
      {teams.map((team, index) => <button type="button" key={index} className={activeTeam === index ? "active" : ""} aria-pressed={activeTeam === index} onClick={() => selectTeam(index)}>
        <span className="kit-swatch" style={{ "--kit": TEAM_COLOR_OPTIONS[colors[index]].kit }} />
        {TEAM_COLOR_OPTIONS[colors[index]].label}<small>{team.length}</small>
      </button>)}
    </div>
    <div className="pitch-carousel" ref={track} onScroll={updateActiveTeam} aria-label="Swipe between team lineups">
      {teams.map((team, teamIndex) => {
        const color = TEAM_COLOR_OPTIONS[colors[teamIndex]];
        return <section className="pitch-slide" key={teamIndex} aria-label={`${color.label} team, ${team.length} players`}>
          <div className="pitch-header"><strong>{color.label} team</strong><span>{team.length} {team.length === 1 ? "player" : "players"}</span></div>
          <div className="football-pitch" style={{ "--kit": color.kit, "--kit-ink": color.ink, "--pitch-rows": Math.ceil(team.length / 3) }}>
            <div className="pitch-lines" aria-hidden="true" />
            <div className="pitch-players">
              {team.map((player, index) => <div className="pitch-player" key={`${player.id}-${index}`}>
                <span className="player-shirt" aria-hidden="true">{index + 1}</span>
                <strong>{player.name}</strong>
                {(player.isCurrentUser || player.id === "me" || player.guest) && <small>{player.guest ? "Guest" : "You"}</small>}
              </div>)}
            </div>
          </div>
        </section>;
      })}
    </div>
    <div className="pitch-dots" aria-hidden="true">{teams.map((_, index) => <span key={index} className={activeTeam === index ? "active" : ""} />)}</div>
  </div>;
}
