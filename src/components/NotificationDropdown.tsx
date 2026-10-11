"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  KeyRound, 
  X, 
  Check, 
  ExternalLink,
  Sparkles 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  AppNotification, 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/lib/notificationService";

interface NotificationDropdownProps {
  onOpenChat: (chatId: string) => void;
}

export default function NotificationDropdown({ onOpenChat }: NotificationDropdownProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.email) {
      setNotifications([]);
      return;
    }

    const unsub = subscribeToNotifications(user.email, (list) => {
      setNotifications(list);
    });

    return () => unsub();
  }, [user]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDropdown = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0 && user?.email) {
      // Instantly clear the unread badge upon viewing notifications
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await markAllNotificationsAsRead(user.email);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // Instantly mark as read in local state
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    await markNotificationAsRead(notif.id, user?.email || undefined);
    setIsOpen(false);
    if (notif.chatId) {
      onOpenChat(notif.chatId);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user?.email) {
      await markAllNotificationsAsRead(user.email);
    }
  };

  if (!user) return null;

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-1.5 rounded-md hover:bg-[#FFE8ED] text-[#881337] hover:text-[#9F1239] transition-colors focus:outline-none shrink-0"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#9F1239] text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#F0BFCB] rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-[#FCE4EC]">
          {/* Header */}
          <div className="bg-[#FFF0F4] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#9F1239]" />
              <span className="text-xs font-bold text-[#1E1215]">Campus Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#FFE4E8] text-[#9F1239] text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#FECDD6]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-[#9F1239] hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#FFF0F4]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#881337] space-y-1">
                <Bell className="w-6 h-6 text-[#F0BFCB] mx-auto mb-1" />
                <p className="font-semibold">No notifications yet</p>
                <p className="text-[10px] text-[#881337]">
                  You will be notified when someone replies to your notices or verifies a claim.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 hover:bg-[#FFF5F8] cursor-pointer transition-colors flex items-start gap-2.5 ${
                    !n.read ? "bg-[#FFF9FB] font-medium" : "opacity-75"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center shrink-0 mt-0.5">
                    {n.type === "CHAT_MESSAGE" ? (
                      <MessageSquare className="w-3.5 h-3.5" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#1E1215] truncate">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#9F1239] shrink-0" />
                      )}
                    </div>
                    <p className="text-[#881337] text-[11px] line-clamp-2 mt-0.5 leading-snug">
                      {n.body}
                    </p>
                    <span className="text-[9px] font-mono text-[#881337]/80 mt-1 block">
                      {n.timestampStr || "Just Now"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
