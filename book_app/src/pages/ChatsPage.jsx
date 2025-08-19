// app/chats/page.jsx or routes/ChatsPage.jsx depending on your routing
import ChatList from "./ChatList";

export default function ChatsPage() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>Your Chats</h2>
      <ChatList />
    </div>
  );
}
