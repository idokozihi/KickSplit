import { useEffect, useState } from "react";
import { useApp } from "../state/context";
import { loadGroupMembers } from "../state/groupsApi";
import { EmptyState, GroupCard, Icon, PageHeading } from "../components/UI";
import { GroupFlow } from "../components/Forms";

export default function Groups() {
  const { groups, groupsLoading, groupsError } = useApp();
  const [flow, setFlow] = useState(null);
  const [memberCounts, setMemberCounts] = useState({});
  const groupIds = groups.map((group) => group.id).sort().join(",");
  useEffect(() => {
    if (!groupIds) return;
    const controller = new AbortController();
    groupIds.split(",").forEach((id) => {
      loadGroupMembers(id, controller.signal)
        .then((members) => { if (!controller.signal.aborted) setMemberCounts((current) => ({ ...current, [id]: members.length })); })
        .catch(() => { if (!controller.signal.aborted) setMemberCounts((current) => ({ ...current, [id]: null })); });
    });
    return () => controller.abort();
  }, [groupIds]);
  return (
    <>
      <PageHeading
        title="Your groups"
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
      {groupsError && <p className="error" role="alert">{groupsError}</p>}
      {groupsLoading ? <EmptyState title="Loading groups..." /> : groups.length ? (
        <div className="cards-grid">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} showMemberCount memberCount={memberCounts[group.id]} />
          ))}
        </div>
      ) : !groupsError && (
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
