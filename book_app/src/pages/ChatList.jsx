// components/ChatList.jsx
"use client";
import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Usercontext } from "../usercontext.jsx";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  // simple: today -> show HH:MM, else date
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString();
}

export default function ChatList() {
  const { user } = useContext(Usercontext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) return;

    // fetch initial list
    setLoading(true);
    axios
      .get("/chats", { withCredentials: true })
      .then((res) => {
        setChats(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load chats", err);
        setChats([]);
      })
      .finally(() => setLoading(false));

    // setup socket and register
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });
    }
    const socket = socketRef.current;
    socket.emit("register", { userId: user._id });

    const handleReceive = (msg) => {
      // msg: { chatId, sender, receiver, text, timestamp }
      setChats((prev) => {
        const copy = [...prev];
        // try find existing chat by chatId or otherUser id
        let idx = copy.findIndex((c) => c.chatId && c.chatId.toString() === (msg.chatId || "").toString());
        if (idx === -1) {
          // not found: try match by otherUser._id === sender or receiver
          idx = copy.findIndex(
            (c) => (c.otherUser && c.otherUser._id && (c.otherUser._id.toString() === msg.sender.toString()))
          );
        }

        const preview = {
          chatId: msg.chatId || null,
          otherUser: { _id: msg.sender.toString(), name: msg.senderName || "Unknown" }, // server can include senderName if desired
          lastMsg: { sender: msg.sender, text: msg.text, timestamp: msg.timestamp },
          unreadCount: msg.receiver === user._id ? 1 : 0,
          updatedAt: msg.timestamp,
        };

        if (idx !== -1) {
          // update existing: bump to top
          const existing = copy[idx];
          existing.lastMsg = preview.lastMsg;
          // if sender is not current user, increment unread
          if (msg.sender !== user._id) {
            existing.unreadCount = (existing.unreadCount || 0) + 1;
          }
          existing.updatedAt = preview.updatedAt;
          // move to front
          copy.splice(idx, 1);
          copy.unshift(existing);
        } else {
          // insert new chat at front
          copy.unshift(preview);
        }
        return copy;
      });
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
      // Optionally keep socket alive for other components; do not disconnect here if you use shared socket
    };
  }, [user]);

  const openChat = (otherUserId) => {
    // navigate to chat page (adapt path to your routing)
    navigate(`/chat/${otherUserId}`);
  };

  if (loading) {
    return <div style={{ padding: 12 }}>Loading chats...</div>;
  }

  if (!chats.length) {
    return <div style={{ padding: 12, color: "#666" }}>No chats yet</div>;
  }

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", fontFamily: "Arial" }}>
      {chats.map((c) => {
        const other = c.otherUser || {};
        const last = c.lastMsg || {};
        return (
          <div
            key={c.chatId || other._id}
            onClick={() => openChat(other._id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 10px",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {(other.name && other.name[0]) || "U"}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{other.name || other.email || "Unknown user"}</div>
                <div style={{ color: "#666", fontSize: 13, marginTop: 4, maxWidth: 420 }}>
                  {last.text ? (last.text.length > 80 ? last.text.slice(0, 80) + "..." : last.text) : "No messages yet"}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#666" }}>{formatTime(c.updatedAt || (last.timestamp || ""))}</div>
              {c.unreadCount > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    background: "#e33",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "2px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "inline-block",
                  }}
                >
                  {c.unreadCount}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
