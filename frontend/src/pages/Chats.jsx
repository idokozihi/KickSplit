import { Link } from "react-router-dom";
import { useApp } from "../state/context";
import { EmptyState, GroupImage, Icon, PageHeading } from "../components/UI";

export default function Chats() {
  const { groups, groupsLoading, groupsError } = useApp();
  return <div className="chat-list-screen">
    <PageHeading title="Chats" subtitle="Your group conversations" />
    {groupsError && <p className="error" role="alert">{groupsError}</p>}
    {groupsLoading ? <EmptyState title="Loading groups..." /> : groups.length ?
      <div className="conversation-list">
        {groups.map((group) => <Link className="conversation-row" key={group.id} to={`/groups/${group.id}/chat`}>
          <GroupImage group={group} />
          <span className="conversation-copy"><strong><bdi>{group.name}</bdi></strong><small>Group chat</small></span>
          <Icon name="arrow" size={18} />
        </Link>)}
      </div> : !groupsError && <EmptyState title="No group chats yet" description="Join or create a group to start a conversation." to="/groups" action="Go to groups" />}
  </div>;
}
