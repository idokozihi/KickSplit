import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../state/context";
import { loadGroupMessages, mergeMessages, messageContent, sendGroupMessage, startMessagePolling } from "../state/groupMessagesApi";
import { Avatar, GroupImage, Icon } from "../components/UI";

function messageTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GroupChat() {
  const { groupId } = useParams();
  const { groups, groupsLoading, user } = useApp();
  const group = groups.find((item) => item.id === groupId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const initialRef = useRef(true);
  const forceScrollRef = useRef(false);
  const nearBottomRef = useRef(true);
  const requestRef = useRef(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async (signal) => {
    if (requestRef.current) return;
    const request = { signal };
    requestRef.current = request;
    try {
      const next = await loadGroupMessages(groupId, user.id, signal);
      if (signal?.aborted || !mountedRef.current) return;
      setMessages((previous) => mergeMessages(previous, next));
      setError("");
    } catch (failure) {
      if (!signal?.aborted && mountedRef.current) setError(failure.message || "Could not load messages.");
    } finally {
      if (requestRef.current === request) requestRef.current = null;
      if (!signal?.aborted && mountedRef.current) setLoading(false);
    }
  }, [groupId, user.id]);

  useEffect(() => {
    mountedRef.current = true;
    const stop = startMessagePolling(refresh);
    return () => {
      mountedRef.current = false;
      stop();
      requestRef.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || (loading && !messages.length)) return;
    if (initialRef.current || forceScrollRef.current || nearBottomRef.current) list.scrollTop = list.scrollHeight;
    initialRef.current = false;
    forceScrollRef.current = false;
  }, [messages, loading]);

  async function send(event) {
    event.preventDefault();
    const content = messageContent(draft);
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const saved = await sendGroupMessage(groupId, user.id, content);
      if (!mountedRef.current) return;
      setDraft("");
      forceScrollRef.current = true;
      setMessages((previous) => mergeMessages(previous, [saved]));
      await refresh();
    } catch (failure) {
      if (mountedRef.current) setError(failure.message || "Could not send message.");
    } finally {
      if (mountedRef.current) setSending(false);
    }
  }

  return <section className="chat-screen" aria-label="Group chat">
    <header className="chat-header">
      <Link className="chat-back" to={`/groups/${groupId}`} aria-label="Back to group"><Icon name="back" size={21} /></Link>
      {group && <GroupImage group={group} />}
      <div className="chat-title"><h1><bdi>{group?.name || (groupsLoading ? "Loading group..." : "Group chat")}</bdi></h1><span>Group chat</span></div>
    </header>
    <div className="chat-messages" ref={listRef} onScroll={(event) => {
      const list = event.currentTarget;
      nearBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 90;
    }} aria-live="polite" aria-relevant="additions">
      {loading && <p className="chat-state" role="status">Loading messages...</p>}
      {!loading && !messages.length && !error && <div className="chat-state"><Icon name="chat" size={30} /><p>No messages yet. Start the conversation.</p></div>}
      {messages.map((message) => {
        const own = String(message.senderId) === String(user.id);
        return <article className={`chat-message ${own ? "own" : "other"}`} key={message.id}>
          {!own && <Avatar name={message.senderName || message.senderUsername || "Member"} photo={message.senderImageUrl} />}
          <div className="chat-bubble">
            {!own && <strong><bdi>{message.senderName || message.senderUsername || "Member"}</bdi></strong>}
            <p><bdi>{message.content}</bdi></p>
            <time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time>
          </div>
        </article>;
      })}
    </div>
    {error && <div className="chat-error" role="alert">{error} <button type="button" onClick={() => refresh()}>Retry</button></div>}
    <form className="chat-composer" onSubmit={send}>
      <input aria-label="Message" placeholder="Message your group" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={5000} />
      <button className="chat-send" type="submit" aria-label={sending ? "Sending message" : "Send message"} disabled={sending || !draft.trim()}><Icon name="arrow" size={18} /></button>
    </form>
  </section>;
}
