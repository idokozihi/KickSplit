import { useState } from "react";
import { useApp } from "../state/context";
import { rankedDays } from "../state/mock";
import { GameCard, Icon, Modal } from "./UI";

export default function ProposedDays({ game, allowProposing = false }) {
  const { proposeDay } = useApp();
  const [proposing, setProposing] = useState(false);
  const days = rankedDays([game]);
  return (
    <div className="card-list">
      {days.map(({ day }, index) => (
        <GameCard key={day.id} game={game} day={day} popular={index === 0} />
      ))}
      {allowProposing && (
        <button className="button secondary" onClick={() => setProposing(true)}>
          <Icon name="plus" size={18} />Propose a day
        </button>
      )}
      {proposing && (
        <Modal title="Propose a day" onClose={() => setProposing(false)}>
          <form className="form" onSubmit={(event) => {
            event.preventDefault();
            proposeDay(game.id, new FormData(event.currentTarget).get("date"));
            setProposing(false);
          }}>
            <label>Proposed day<input name="date" type="date" required autoFocus /></label>
            <p className="form-hint">Let your group know which day could work. Mark your availability on the card.</p>
            <button className="button primary">Propose day</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
