"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: number;
  sender: {
    id: number;
    email: string;
    username: string;
  };
  recipient: {
    id: number;
    email: string;
    username: string;
  };
  subject: string;
  content: string;
  read_status: boolean;
  timestamp: string;
}

export default function MessagingIcon() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/messaging/messages/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const messages: Message[] = await response.json();
        const unreadMessages = messages.filter(msg => !msg.read_status);
        setUnreadCount(unreadMessages.length);
        setRecentMessages(messages.slice(0, 5)); // Show last 5 messages
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const markAsRead = async (messageId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`http://localhost:8000/api/messaging/messages/${messageId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read_status: true }),
      });
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Messages</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No messages yet
              </div>
            ) : (
              recentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 border-b border-border hover:bg-accent cursor-pointer ${
                    !message.read_status ? "bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                  onClick={() => markAsRead(message.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {message.sender.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    {message.subject}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {message.content}
                  </p>
                  {!message.read_status && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Navigate to full messaging interface
                window.location.href = "/messages";
              }}
            >
              View All Messages
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
