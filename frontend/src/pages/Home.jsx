import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApp } from "../state/context";
import { participantCount, proposedDate, rankedDays } from "../state/mock";
import { Avatar, EmptyState, GameCard, GroupCard, Icon, Section } from "../components/UI";

function dayKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export default function Home() {
  const { user, groups, games } = useApp();
  const [calendarDay, setCalendarDay] = useState(() => dayKey(new Date()));
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(() => setCalendarDay(dayKey(new Date())), nextMidnight.getTime() - now.getTime() + 50);
    return () => clearTimeout(timer);
  }, [calendarDay]);
  const today = new Date();
  const upcoming = rankedDays(games).filter(({ day }) => day.date.slice(0, 10) >= calendarDay);
  const byDate = [...upcoming].sort((a, b) => a.day.date.localeCompare(b.day.date));
  const next = byDate[0];
  const popular = upcoming[0];
  const waiting = byDate.filter(({ day }) => !day.availability.me && day !== next?.day);
  const fourteenDays = Array.from({ length: 14 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    return { date, key: dayKey(date) };
  });

  return <div className="home-screen">
    <header className="home-identity">
      <div><span className="home-kicker">KICKSPLIT</span><h1>Hey, {user.name.split(" ")[0]}.</h1><p>Ready for your next game?</p></div>
      <Link to="/profile" aria-label="Your profile"><Avatar name={user.name} photo={user.photo} /></Link>
    </header>
    <Section title="Next game" link={next ? { to: "/games", label: "All games" } : null}>
      {next ? <GameCard {...next} featured loadGuestList={next.game.backendBacked} />
        : <EmptyState title="Your next game starts with a group" description="Join your football crew or create a group to get the ball rolling." to="/groups" action="Find your crew" />}
    </Section>
    <Section title="Next 14 days" link={{ to: "/games", label: "Calendar" }}>
      <div className="home-date-strip" aria-label="Games in the next 14 days">
        {fourteenDays.map(({ date, key }) => {
          const entry = byDate.find(({ day }) => day.date.slice(0, 10) === key);
          const content = <><small>{date.toLocaleDateString("en-GB", { weekday: "short" })}</small><strong>{date.getDate()}</strong><span className="home-date-status"><i className={entry ? "has-game" : ""}>{entry ? "✓" : "·"}</i>{entry && (!entry.game.backendBacked || entry.game.registrationsFor) && <small>{participantCount(entry.day)}/{entry.game.target}</small>}</span></>;
          return entry ? <Link key={key} className={`home-date has-game ${entry.day === popular?.day ? "popular" : ""}`} to={`/games/${entry.game.id}?day=${entry.day.id}`} aria-label={`Game on ${date.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}>{content}</Link>
            : <span key={key} className="home-date">{content}</span>;
        })}
      </div>
    </Section>
    {popular && <Link className="popular-game-row home-popular-row" to={`/games/${popular.game.id}?day=${popular.day.id}`}>
      <span className="popular-game-icon"><Icon name="games" size={19} /></span>
      <span><small className="popular-label"><Icon name="crown" size={14} />Most popular day</small><strong>{proposedDate(popular.day.date)}</strong><small>{(!popular.game.backendBacked || popular.game.registrationsFor) && `${participantCount(popular.day)} available · `}<bdi>{popular.game.title}</bdi></small></span>
      <Icon name="arrow" size={17} />
    </Link>}
    {waiting.length > 0 && <Section title="Waiting on your response" link={{ to: "/games", label: "View all" }}>
      <div className="card-list">{waiting.slice(0, 2).map(({ game, day }) => <GameCard key={`${game.id}-${day.id}`} game={game} day={day} loadGuestList={game.backendBacked} />)}</div>
    </Section>}
    <Section title="Your groups" link={{ to: "/groups", label: "View all" }}>
      {groups.length ? <div className="group-row-list">{groups.slice(0, 3).map((group) => <GroupCard key={group.id} group={group} />)}</div>
        : <div className="quiet-state"><Icon name="groups" /><p>Your groups will appear here once you join a crew.</p></div>}
    </Section>
  </div>;
}
