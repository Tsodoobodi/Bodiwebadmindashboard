"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User, HelpCircle, ChevronDown, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 10 * 60 * 1000;

export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    router.push("/login");
  }, [router]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => handleLogout(), IDLE_TIMEOUT);
  }, [handleLogout]);

  const handleUserActivity = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach((event) => document.addEventListener(event, handleUserActivity));
    resetIdleTimer();
    return () => {
      events.forEach((event) => document.removeEventListener(event, handleUserActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleUserActivity, resetIdleTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= IDLE_TIMEOUT) handleLogout();
        else resetIdleTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleLogout, resetIdleTimer]);

  const menuItems = [
    { label: "Профайл", icon: User, href: "/profile" },
    { label: "Тохиргоо", icon: Settings, href: "/settings" },
    { label: "Тусламж", icon: HelpCircle, href: "/help" },
  ];

  return (
    <header className="h-20 border-b border-gray-100 bg-white/70 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex flex-col">
        <span className="text-[15px] font-semibold text-gray-800">Bodi Web Admin</span>
        <span className="text-xs text-gray-400">Content management dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-600" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <div className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
              <AvatarImage src="/images/logo.png" alt="Profile" />
              <AvatarFallback className="text-xs bg-blue-50 text-blue-600 font-semibold">U</AvatarFallback>
            </Avatar>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl shadow-xl rounded-xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="flex flex-col py-1.5">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            setOpen(false);
                            router.push(item.href);
                          }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                        >
                          <Icon size={16} className="text-gray-400" />
                          {item.label}
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-100 my-1.5" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Гарах
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}