// app/place/[id]/ChatBox.jsx  (rename to something generic like ChatBoxUser.jsx)
"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { Usercontext } from "../usercontext.jsx";

export default function ChatBox({ otherUserId }) {
  const { user } = useContext(Usercontext);
  const currentUserId = user?._id;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const socketRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    // create socket once
    if (!socketRef.current) {
      // Option A: pass token if you can read it (NOT httpOnly cookies)
      // socketRef.current = io("http://localhost:3000", { auth: { token: yourToken } });
      
      // Option B (works with httpOnly cookie): connect then register userId
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });
    }
    const socket = socketRef.current;

    // register the user (join personal room)
    socket.emit("register", { userId: currentUserId });

    // fetch chat history
    axios
      .get(`/chat/${otherUserId}`, { withCredentials: true })
      .then((res) => {
        if (res.data && Array.isArray(res.data.messages)) {
          // console.log(res.data)
          // console.log(currentUserId)
          // console.log(res.data.messages[0].sender==currentUserId)
          setMessages(res.data.messages);
        } else {
          setMessages([]);
        }
        // scroll to bottom
        setTimeout(() => messagesRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .catch((err) => {
        console.error("Failed to load chat:", err);
        setMessages([]);
      });

    // receive handler
    const handleReceive = (msg) => {
      // msg shape: { chatId, sender, receiver, text, timestamp }
      const shaped = {
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => (Array.isArray(prev) ? [...prev, shaped] : [shaped]));
      // scroll
      setTimeout(() => messagesRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
      // optionally: socket.disconnect() if you want per-component socket lifecycle
    };
  }, [currentUserId, otherUserId]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    const msgToSend = {
      receiverId: otherUserId,
      text: newMsg.trim(),
      // don't send senderId if server is using socket.user.id
    };

    // optimistic append
    const optimistic = {
      sender: currentUserId,
      text: msgToSend.text,
      timestamp: new Date().toISOString(),
    };
    // setMessages((prev) => (Array.isArray(prev) ? [...prev, optimistic] : [optimistic]));
    setNewMsg("");

    if (socketRef.current) {
      socketRef.current.emit("sendMessage", msgToSend);
    } else {
      // fallback: send REST endpoint to push message server-side (optional)
      try {
        await axios.post(
          "/api/send-message",
          { receiverId: otherUserId, text: msgToSend.text },
          { withCredentials: true }
        );
      } catch (err) {
        console.error("fallback send failed", err);
      }
    }
    setTimeout(() => messagesRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 10, width: 400, padding: 10 }}>
      <div style={{ height: 320, overflowY: "auto", padding: 8 }}>
        {Array.isArray(messages) && messages.length ? (
          messages.map((m, idx) => (
            <div key={idx} style={{ textAlign: m.sender === currentUserId || m.sender?._id == currentUserId? "right" : "left", margin: 6 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 15,
                  background: m.sender == currentUserId || m.sender?._id == currentUserId  ? "#007bff" : "#e5e5ea",
                  color: m.sender == currentUserId || m.sender?._id == currentUserId ? "#fff" : "#000",
                  maxWidth: "75%",
                  wordBreak: "break-word",
                }}
              >
                {m.text}
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: "#666" }}>No messages yet</div>
        )}
        <div ref={messagesRef} />
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8, borderRadius: 20, border: "1px solid #ccc" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage} style={{ padding: "8px 12px", borderRadius: 12, background: "#007bff", color: "#fff", border: "none" }}>
          Send
        </button>
      </div>
    </div>
  );
}
