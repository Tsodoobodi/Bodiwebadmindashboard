"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  return (
    <header className="h-16 border-b bg-gradient-to-r from-background/80 to-muted/40 backdrop-blur-md flex items-center justify-between px-6 relative shadow-sm z-20">
      {/* Logo + title */}
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-sm text-muted-foreground">
          Bodi Web Admin
        </span>
        <span className="hidden md:inline text-sm text-muted-foreground">
          Dashboard v2.0
        </span>
      </div>

      {/* Avatar + dropdown */}
      <div className="relative">
        <Avatar
          className="cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition rounded-full"
          onClick={() => setOpen((prev) => !prev)}
        >
          <AvatarImage src="/images/logo.png" alt="Profile" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        {/* Dropdown with animation */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-48 bg-card shadow-2xl rounded-xl border overflow-hidden z-50"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/profile");
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-muted/60 transition"
                >
                  <User size={16} /> Profile
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/settings");
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-muted/60 transition"
                >
                  <Settings size={16} /> Settings
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/help");
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-muted/60 transition"
                >
                  <HelpCircle size={16} /> Help
                </button>
                <div className="border-t my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 transition"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
