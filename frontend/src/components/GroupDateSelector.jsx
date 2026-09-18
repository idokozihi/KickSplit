import { useState } from "react";
import { Link } from "react-router-dom";
import { proposedDate } from "../state/mock";
import { CreateGameForm } from "./Forms";

function localDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export default function GroupDateSelector({ groupId, scheduled }) {
  const [creating, setCreating] = useState(null);
  const [moreDates, setMoreDates] = useState(false);
  const [laterDate, setLaterDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return { key: localDateKey(date), date };
  });
  const byDate = new Map();
  scheduled.forEach((entry) => {
    const key = entry.day.date.slice(0, 10);
    byDate.set(key, [...(byDate.get(key) || []), entry]);
  });
  const firstLater = new Date(today);
  firstLater.setDate(today.getDate() + 14);
  const lastDate = localDateKey(firstLater);
  const laterGames = byDate.get(selectedDate || laterDate) || [];
  return <>
    <div className="date-strip" aria-label="Next 14 days">
      {dates.map(({ key, date }) => {
        const entries = byDate.get(key) || [];
        const tile = <><span>{date.toLocaleDateString("en-GB", { weekday: "short" })}</span><strong>{date.getDate()}</strong><small>{date.toLocaleDateString("en-GB", { month: "short" })}</small>{entries.length > 0 && <i aria-label="Game proposed" />}{entries.some((entry) => entry === scheduled[0]) && <em>Popular</em>}</>;
        return entries.length === 1
          ? <Link className="date-tile has-game" key={key} to={`/games/${entries[0].game.id}?day=${entries[0].day.id}`} aria-label={`${proposedDate(key)}, game proposed`}>{tile}</Link>
          : <button className={`date-tile ${entries.length ? "has-game" : ""}`} key={key} onClick={() => entries.length ? setSelectedDate(key) : setCreating(key)} aria-label={`${proposedDate(key)}${entries.length ? `, ${entries.length} games` : ", create game"}`}>{tile}</button>;
      })}
      <button className="date-tile more-date-tile" onClick={() => setMoreDates((value) => !value)}>Calendar<br />More dates</button>
    </div>
    {(moreDates || laterDate || selectedDate) && <div className="date-more">
      {moreDates && <label>Choose a later date <input type="date" min={lastDate} value={laterDate} onChange={(event) => { setLaterDate(event.target.value); setSelectedDate(""); }} /></label>}
      {laterDate && laterGames.length === 0 && <button className="button primary" onClick={() => setCreating(laterDate)}>Create game</button>}
      {laterGames.map(({ game, day }) => <Link className="date-game-link" key={`${game.id}-${day.id}`} to={`/games/${game.id}?day=${day.id}`}>{game.title} · {proposedDate(day.date)}</Link>)}
    </div>}
    {creating && <CreateGameForm groupId={groupId} date={creating} onClose={() => setCreating(null)} />}
  </>;
}
