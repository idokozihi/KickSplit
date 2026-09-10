import { useState } from "react";
import { useApp } from "../state/context";
import { EmptyState, GroupCard, Icon, PageHeading } from "../components/UI";
import { GroupFlow } from "../components/Forms";

export default function Groups() {
  const { groups } = useApp();
  const [flow, setFlow] = useState(null);
  return (
    <>
      <PageHeading
        eyebrow="THE PEOPLE YOU PLAY WITH"
        title="Your groups"
        subtitle="The usual faces. The best part of your week."
        action={
          <div className="actions">
            <button
              className="button secondary"
              onClick={() => setFlow("join")}
            >
              Join group
            </button>
            <button
              className="button primary"
              onClick={() => setFlow("create")}
            >
              <Icon name="plus" size={18} />
              Create group
            </button>
          </div>
        }
      />
      {groups.length ? (
        <div className="cards-grid">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Build your football circle"
          description="Create a group for your friends, or join an existing crew with an invite code."
        />
      )}
      <div className="info-strip">
        <Icon name="groups" />
        <p>
          Different crew, different game. Your player ratings are set separately
          in each group.
        </p>
      </div>
      {flow && <GroupFlow mode={flow} onClose={() => setFlow(null)} />}
    </>
  );
}
