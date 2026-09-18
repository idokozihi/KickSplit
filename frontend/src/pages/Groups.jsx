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
    <div className="groups-screen">
      <PageHeading title="My Groups" action={<button className="button primary groups-create" onClick={() => setFlow("create")}><Icon name="plus" size={16} />Create</button>} />
      <div className="group-list-actions"><button className="text-link" onClick={() => setFlow("join")}>Have an invite? Join group <Icon name="arrow" size={14} /></button></div>
      {groupsError && <p className="error" role="alert">{groupsError}</p>}
      {groupsLoading ? <EmptyState title="Loading groups..." /> : groups.length ? (
        <div className="group-row-list">
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
      {!groups.length && <div className="info-strip">
        <Icon name="groups" />
        <p>
          Different crew, different game. Your player ratings are set separately
          in each group.
        </p>
      </div>}
      {flow && <GroupFlow mode={flow} onClose={() => setFlow(null)} />}
    </div>
  );
}
