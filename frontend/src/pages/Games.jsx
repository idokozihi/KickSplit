import { useApp } from "../state/context";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadGameResult } from "../state/gameResultsApi";
import { gameDays, proposedDate, rankedDaysByGroup } from "../state/mock";
import { groupTeamColors, TEAM_COLOR_OPTIONS } from "../state/teamColors";
import {
  EmptyState,
  GameCard,
  Icon,
  PageHeading,
  Section,
} from "../components/UI";

function localDayKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export default function Games() {
  const { games, groups, gamesLoading, gamesError, groupsError } = useApp();
  const [todayKey, setTodayKey] = useState(localDayKey);
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(() => setTodayKey(localDayKey()), nextMidnight.getTime() - now.getTime() + 50);
    return () => clearTimeout(timer);
  }, [todayKey]);
  const isPast = (date) => date.slice(0, 10) < todayKey;
  const scheduled = rankedDaysByGroup(games).filter(({ day }) => !isPast(day.date));
  const upcomingMonths = [...new Set(scheduled.map(({ day }) => day.date.slice(0, 7)))].sort();
  const past = games.flatMap((game) => gameDays(game).filter((day) => isPast(day.date)).map((day) => ({ game, day })))
    .sort((a, b) => b.day.date.localeCompare(a.day.date));
  const [results, setResults] = useState({});
  const [pastOpen, setPastOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const pastIds = [...new Set(past.filter(({ game }) => game.backendBacked).map(({ game }) => game.id))].join(",");
  useEffect(() => {
    if (!pastIds || !pastOpen) return;
    const controller = new AbortController();
    pastIds.split(",").forEach((id) => {
      loadGameResult(id, controller.signal)
        .then((result) => { if (!controller.signal.aborted) setResults((current) => ({ ...current, [id]: { result } })); })
        .catch((error) => { if (!controller.signal.aborted) setResults((current) => ({ ...current, [id]: { error: error.message } })); });
    });
    return () => controller.abort();
  }, [pastIds, pastOpen, retry]);
  return (
    <div className="games-screen">
      <PageHeading title="Games" action={<Link className="button primary games-new-action" to="/groups" aria-label="Choose a group to create a game"><Icon name="plus" size={16} />New game</Link>} />
      <div className="games-section-switch" aria-label="Game sections">
        <button type="button" className={!pastOpen ? "active" : ""} aria-pressed={!pastOpen} onClick={() => setPastOpen(false)}>Upcoming</button>
        <button type="button" className={pastOpen ? "active" : ""} aria-pressed={pastOpen} onClick={() => setPastOpen(true)}>Past</button>
      </div>
      {!pastOpen && <>
      <Section
        title="Proposed days"
      >
        {(gamesError || groupsError) && <p className="error" role="alert">{gamesError || groupsError}</p>}
        {gamesLoading ? <EmptyState title="Loading games..." /> : scheduled.length ? (
          upcomingMonths.map((month) => <div className="games-month" key={month}>
            <h3>{new Date(`${month}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h3>
            <div className="game-row-list">{scheduled.filter(({ day }) => day.date.startsWith(month)).sort((a, b) => a.day.date.localeCompare(b.day.date)).map(({ game, day, popular }) =>
              <GameCard game={game} day={day} popular={popular} loadGuestList={game.backendBacked} key={`${game.id}-${day.id}`} />)}</div>
          </div>)
        ) : !gamesError && !groupsError && (
          <EmptyState
            title="An open calendar, for now"
            description="Join a group or create a game from your group page."
            to="/groups"
            action="Go to groups"
          />
        )}
      </Section>
      <div className="games-photo-banner"><strong>Good players.<br />Great people.</strong></div>
      </>}
      <section className="section past-games-section">
      {pastOpen && <>
        <h2>Past games · {past.length}</h2>
        {(gamesError || groupsError) && <p className="error" role="alert">{gamesError || groupsError}</p>}
        {gamesLoading ? <EmptyState title="Loading games..." /> : past.length ? <div className="game-row-list">
          {past.map(({ game, day }) => {
            const entry = results[game.id];
            const teamNames = groupTeamColors(groups.find((group) => group.id === String(game.groupId))).map((color) => TEAM_COLOR_OPTIONS[color].label);
            const date = new Date(day.date.includes("T") ? day.date : `${day.date}T00:00:00`);
            return <article className="game-card past-game-card" key={`${game.id}-${day.id}`}>
              <div className="game-date-block" aria-hidden="true"><small>{date.toLocaleDateString("en-GB", { weekday: "short" })}</small><strong>{date.getDate()}</strong><small>{date.toLocaleDateString("en-GB", { month: "short" })}</small></div>
              <div className="game-card-content"><span className="group-label">{game.groupName}</span><h3><Link to={`/games/${game.id}?day=${day.id}`}><bdi>{game.title}</bdi></Link></h3><p className="muted">{proposedDate(day.date)}</p>
              {entry?.error ? <><p className="error" role="alert">{entry.error}</p><button className="button secondary" onClick={() => setRetry((value) => value + 1)}>Retry</button></>
                : <p>{game.backendBacked && !entry ? "Loading result..." : entry?.result
                  ? `${teamNames[0]} ${entry.result.team1Wins} ֲ· ${teamNames[1]} ${entry.result.team2Wins} ֲ· ${teamNames[2]} ${entry.result.team3Wins} wins`
                  : "Result not entered"}</p>}</div>
              <Link className="circle-arrow" to={`/games/${game.id}?day=${day.id}`} aria-label={`View ${game.title}`}><span aria-hidden="true">›</span></Link>
            </article>;
          })}
        </div> : <EmptyState title="No past games yet" />}
      </>}</section>
    </div>
  );
}
