// pages/Chat.jsx

import { useParams } from "react-router-dom";
import GroupTabs from "../components/GroupTabs";

export default function Chat() {
  const { groupId } = useParams();

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName="..." myRole={null} />

      <div className="chat-log">
        <div className="empty-state">No messages yet - say hi!</div>
      </div>

      <form className="chat-form">
        <input
          value=""
          onChange={() => {}}
          placeholder="Type a message......."
          maxLength={2000}
        />
        <button type="submit">▶</button>
      </form>
    </div>
  );
}