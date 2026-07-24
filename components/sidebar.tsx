"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Newspaper,
  Video,
  ChevronDown,
  Book,
  Users,
  ClipboardList,
} from "lucide-react";
import Image from "next/image";

const menu = [
  { label: "Хяналтын самбар", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Мэдээ мэдээлэл", icon: Newspaper, href: "/dashboard/news" },
  { label: "Видео мэдээ", icon: Video, href: "/dashboard/videonews" },
  { label: "Бонз", icon: Book },
  { label: "RnD", icon: Users },
  { label: "Санал асуулага", icon: ClipboardList, href: "/dashboard/survey" },
];

const bonzSubMenu = [
  { label: "Бүгд", href: "/dashboard/bonz/all" },
  { label: "Байгаль", href: "/dashboard/bonz/nature" },
  { label: "Нийгэм", href: "/dashboard/bonz/person" },
  { label: "Засаглал", href: "/dashboard/bonz/development" },
];

const rndSubMenu = [
  { label: "Танилцуулага", href: "/dashboard/rnd/presentation" },
  { label: "Хамтын ажиллагаа", href: "/dashboard/rnd/work" },
  { label: "Судалгаа хөгжүүлэлт", href: "/dashboard/rnd/research" },
];

function GlowBar() {
  return (
    <motion.span
      layoutId="sidebar-glow"
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full"
      style={{
        background: "linear-gradient(180deg, #60a5fa, #2563eb)",
        boxShadow:
          "0 0 6px 1px rgba(37,99,235,0.9), 0 0 14px 4px rgba(37,99,235,0.5), 0 0 24px 8px rgba(59,130,246,0.25)",
      }}
    />
  );
}

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [mounted, setMounted] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Бонз: false,
    RnD: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isBonzActive = bonzSubMenu.some((sub) => pathname === sub.href);
    const isRndActive = rndSubMenu.some((sub) => pathname === sub.href);
    setOpenMenus((prev) => ({
      Бонз: isBonzActive || prev.Бонз,
      RnD: isRndActive || prev.RnD,
    }));
  }, [pathname, mounted]);

  const toggleMenu = (menuLabel: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };

  const isBonzActiveNow = bonzSubMenu.some((sub) => pathname === sub.href);
  const isRndActiveNow = rndSubMenu.some((sub) => pathname === sub.href);

  const NAV_ITEM_BASE =
    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-[14px] transition-colors duration-200 relative";

  if (!mounted) {
    return (
      <aside className="w-64 h-screen bg-white p-5 flex flex-col gap-1 border-r border-gray-100">
        <div className="flex items-center justify-center py-4 mb-4">
          <Image src="/images/mainlogo.png" alt="Company Logo" width={150} height={46} priority />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-screen relative flex flex-col border-r border-white/20 overflow-hidden">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-center py-6 px-5 border-b border-white/30">
          <Image src="/images/mainlogo.png" alt="Company Logo" width={150} height={46} priority />
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4 overflow-y-auto flex-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const isБонз = item.label === "Бонз";
            const isRnd = item.label === "RnD";
            const subMenuItems = isБонз ? bonzSubMenu : isRnd ? rndSubMenu : [];
            const isActiveParent = isБонз ? isBonzActiveNow : isRnd ? isRndActiveNow : false;
            const isOpen = openMenus[item.label] || isActiveParent;

            if (isБонз || isRnd) {
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    aria-expanded={isOpen}
                    className={`${NAV_ITEM_BASE} w-full justify-between ${
                      isActiveParent
                        ? "bg-blue-50/80 text-blue-700"
                        : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                    }`}
                  >
                    {isActiveParent && <GlowBar />}
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        strokeWidth={2}
                        className={isActiveParent ? "text-blue-600" : "text-gray-400"}
                      />
                      <span>{item.label}</span>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-gray-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-0.5 ml-[26px] mt-1 mb-1 pl-4 border-l border-white/40">
                          {subMenuItems.map((sub) => {
                            const activeSub =
                              pathname === sub.href || pathname.startsWith(sub.href + "/");
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                className={`relative px-3 py-2 rounded-md text-[13.5px] transition-colors duration-200 ${
                                  activeSub
                                    ? "text-blue-700 font-medium bg-blue-50/80"
                                    : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                                }`}
                              >
                                {activeSub && <GlowBar />}
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            const activeTop = item.href
              ? pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              : false;

            return (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                className={`${NAV_ITEM_BASE} ${
                  activeTop
                    ? "bg-blue-50/80 text-blue-700"
                    : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                {activeTop && <GlowBar />}
                <Icon size={18} strokeWidth={2} className={activeTop ? "text-blue-600" : "text-gray-400"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/30 text-center text-xs text-gray-400">
          © 2026 <span className="font-semibold text-gray-500">Bodi Group</span>
        </div>
      </div>
    </aside>
  );
}