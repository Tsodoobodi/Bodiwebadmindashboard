"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Newspaper } from "lucide-react";
import Image from "next/image";

const menu = [
  { label: "Мэдээ мэдээлэл", icon: Newspaper, href: "/dashboard/news" },
  { label: "Видео мэдээ", icon: Newspaper, href: "/dashboard/videonews" },
];

const researchSubMenu = [
  { label: "Innovation", href: "/dashboard/innovation" },
  { label: "Event", href: "/dashboard/event" },
];

const rndSubMenu = [
  { label: "Хамтын ажиллагаа", href: "/dashboard/worktogether/partner" },
  { label: "Судалгаа хөгжүүлэлт", href: "/dashboard/worktogether/research" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    Research: false,
    "R&D": false,
  });

  const toggleMenu = (menuLabel: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuLabel]: !prev[menuLabel],
    }));
  };

  const isResearchActive = researchSubMenu.some((sub) =>
    pathname.startsWith(sub.href)
  );
  const isRndActive = rndSubMenu.some((sub) => pathname.startsWith(sub.href));

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 60 }}
      className="w-64 h-screen bg-white/60 backdrop-blur-md p-6 flex flex-col gap-10 shadow-xl border-r border-gray-200 relative"
    >
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <Image
          src="/images/mainlogo.png"
          alt="Company Logo"
          width={160}
          height={50}
          className="drop-shadow-lg"
        />
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isResearch = item.label === "Research";
          const isRnd = item.label === "R&D";
          const activeParent =
            (isResearch && isResearchActive) || (isRnd && isRndActive);

          // Sub-menu for accordion
          const subMenuItems = isResearch
            ? researchSubMenu
            : isRnd
            ? rndSubMenu
            : [];

          return (
            <div key={item.label} className="relative">
              {isResearch || isRnd ? (
                <div
                  onClick={() => toggleMenu(item.label)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    activeParent || openMenus[item.label]
                      ? "bg-blue-50 text-blue-600 shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  <Icon size={20} className="text-gray-400" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ) : (
                <Link href={item.href!}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer transition-all duration-300 ${
                      pathname.startsWith(item.href!)
                        ? "bg-blue-50 text-blue-600 shadow-md"
                        : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    }`}
                  >
                    {pathname.startsWith(item.href!) && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 h-full w-1.5 bg-blue-500 rounded-r-full"
                      />
                    )}
                    <Icon
                      size={20}
                      className={`transition-colors ${
                        pathname.startsWith(item.href!)
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`transition-transform ${
                        pathname.startsWith(item.href!)
                          ? "translate-x-1 font-semibold"
                          : ""
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              )}

              {/* Sub-menu */}
              {(isResearch || isRnd) && (
                <AnimatePresence initial={false}>
                  {(openMenus[item.label] || activeParent) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col ml-6 mt-1 gap-1 overflow-hidden"
                    >
                      {subMenuItems.map((sub) => {
                        const activeSub = pathname === sub.href;
                        return (
                          <Link key={sub.label} href={sub.href}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                activeSub
                                  ? "bg-blue-50 text-blue-600 font-semibold shadow-inner"
                                  : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                              }`}
                            >
                              {sub.label}
                            </motion.div>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
        © 2025 <span className="font-semibold text-gray-700">Bodi Group</span>
      </div>
    </motion.aside>
  );
}
