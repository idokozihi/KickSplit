import { useState } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../state/context";
import { upcoming } from "../state/mock";
import {
  Avatar,
  BackLink,
  EmptyState,
  GameCard,
  GroupImage,
  Icon,
  Modal,
  Section,
} from "../components/UI";
import { CreateGameForm, RatingFields } from "../components/Forms";

export default function Group() {
  const { groupId } = useParams();
  const { groups, games, user, updateRatings } = useApp();
  const group = groups.find((item) => item.id === groupId);
  const [creating, setCreating] = useState(false);
  const [ratings, setRatings] = useState(null);
  if (!group)
    return (
      <EmptyState
        title="Group not found"
        description="This group isn’t in your current demo session."
        to="/groups"
        action="Your groups"
      />
    );
  const scheduled = upcoming(games.filter((game) => game.groupId === groupId));
  return (
    <>
      <BackLink to="/groups">Your groups</BackLink>
      <header className="group-hero">
        <GroupImage group={group} large />
        <div>
          <p className="eyebrow">YOUR FOOTBALL CREW</p>
          <h1>{group.name}</h1>
          <p>{group.description}</p>
          <span className="group-member-count">
            <Icon name="groups" size={17} />
            {group.members.length} members
          </span>
        </div>
      </header>
      <div className="home-grid">
        <div>
          <Section title="Upcoming games">
            <button
              className="button primary section-action"
              onClick={() => setCreating(true)}
            >
              <Icon name="plus" size={18} />
              Create game
            </button>
            {scheduled.length ? (
              <div className="card-list">
                {scheduled.map((game) => (
                  <GameCard game={game} key={game.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Who’s up for a game?"
                description="Set a date and give your crew something to look forward to."
              />
            )}
          </Section>
          <Section title={`Members · ${group.members.length}`}>
            <div className="member-grid">
              {group.members.map((member, index) => (
                <div className="person" key={index}>
                  <Avatar
                    name={index === 0 ? user.name : member}
                    photo={index === 0 ? user.photo : undefined}
                  />
                  <span>
                    {index === 0 ? user.name : member}
                    {index === 0 && <small>You</small>}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
        <aside>
          <Section title="Your player profile">
            <div className="panel">
              <div className="person">
                <Avatar name={user.name} photo={user.photo} />
                <div>
                  <h3>{user.name}</h3>
                  <small>In {group.name}</small>
                </div>
              </div>
              <div className="rating-summary">
                {Object.entries(group.ratings).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>
                      {value}
                      <small>/ 5</small>
                    </strong>
                  </div>
                ))}
              </div>
              <p className="form-hint">
                Your self-ratings for this group only.
              </p>
              <button
                className="button secondary full-width"
                onClick={() => setRatings({ ...group.ratings })}
              >
                Edit group ratings
              </button>
            </div>
          </Section>
        </aside>
      </div>
      {creating && (
        <CreateGameForm groupId={groupId} onClose={() => setCreating(false)} />
      )}
      {ratings && (
        <Modal title="Your group ratings" onClose={() => setRatings(null)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              updateRatings(groupId, ratings);
              setRatings(null);
            }}
          >
            <RatingFields value={ratings} onChange={setRatings} />
            <button className="button primary">Save ratings</button>
          </form>
        </Modal>
      )}
    </>
  );
}
