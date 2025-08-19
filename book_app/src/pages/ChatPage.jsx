// app/chat/[otherUserId]/page.jsx (example)
import ChatBox from "./ChatBox";
import { useParams } from "react-router-dom";

export default function ChatPage() {
  const { otherUserId } = useParams();
  return (
    <div style={{ padding: 20 }}>
      <ChatBox otherUserId={otherUserId} />
    </div>
  );
}
