"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Newspaper, Video, ChevronDown, ChevronRight, Book, Users } from "lucide-react";
import Image from "next/image";

const menu = [
  { label: "Мэдээ мэдээлэл", icon: Newspaper, href: "/dashboard/news" },
  { label: "Видео мэдээ", icon: Video, href: "/dashboard/videonews" },
  { label: "Bonz", icon: Book },
  { label: "RnD", icon: Users },
];

const bonzSubMenu = [
  { label: "Бүгд", href: "/dashboard/bonz/all" },
  { label: "Байгаль", href: "/dashboard/bonz/nature" },
  { label: "Хүн", href: "/dashboard/bonz/person" },
  { label: "Хөгжил", href: "/dashboard/bonz/development" },
];

const rndSubMenu = [
  { label: "Танилцуулага", href: "/dashboard/rnd/presentation" },
  { label: "Хамтын ажиллагаа", href: "/dashboard/rnd/work" },
  { label: "Судалгаа хөгжүүлэлт", href: "/dashboard/rnd/research" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Bonz: false,
    RnD: false,
  });

  useEffect(() => {
    setOpenMenus({
      Bonz: bonzSubMenu.some((sub) => pathname.startsWith(sub.href)),
      RnD: rndSubMenu.some((sub) => pathname.startsWith(sub.href)),
    });
  }, [pathname]);

  const toggleMenu = (menuLabel: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };

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
          const isBonz = item.label === "Bonz";
          const isRnd = item.label === "RnD";

          const subMenuItems = isBonz ? bonzSubMenu : isRnd ? rndSubMenu : [];

          const isOpen = !!openMenus[item.label];
          const isActiveParent = isOpen || subMenuItems.some((sub) => pathname.startsWith(sub.href));

          if (isBonz || isRnd) {
            return (
              <div key={item.label} className="relative">
                <button
                  type="button"
                  onClick={() => toggleMenu(item.label)}
                  aria-expanded={isOpen}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg w-full text-left transition-all duration-300 ${
                    isActiveParent
                      ? "bg-blue-50 text-blue-600 shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={`${isActiveParent ? "text-blue-600" : "text-gray-400"}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isOpen ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-400" />}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col ml-6 mt-1 gap-1 overflow-hidden"
                    >
                      {subMenuItems.map((sub) => {
                        const activeSub = pathname === sub.href;
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={`px-4 py-2 rounded-lg block transition-all duration-200 transform ${
                              activeSub
                                ? "bg-blue-50 text-blue-600 font-semibold shadow-inner"
                                : "text-gray-700 hover:bg-gray-100 hover:text-blue-600 hover:scale-[1.02]"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const activeTop = item.href ? pathname.startsWith(item.href) : false;

          return (
            <Link
              key={item.label}
              href={item.href ?? "#"}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTop ? "bg-blue-50 text-blue-600 shadow-md" : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
              }`}
            >
              <Icon size={20} className={`transition-colors ${activeTop ? "text-blue-600" : "text-gray-400"}`} />
              <span className={`${activeTop ? "translate-x-1 font-semibold" : ""}`}>{item.label}</span>
            </Link>
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
