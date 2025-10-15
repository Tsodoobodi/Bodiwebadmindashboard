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
  { label: "Бонз", icon: Book },
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
    Бонз: false,
    RnD: false,
  });

  // Check if any submenu is active and open parent
  useEffect(() => {
    const isBonzActive = bonzSubMenu.some((sub) => pathname === sub.href);
    const isRndActive = rndSubMenu.some((sub) => pathname === sub.href);

    setOpenMenus({
      Бонз: isBonzActive,
      RnD: isRndActive,
    });
  }, [pathname]);

  const toggleMenu = (menuLabel: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className="w-64 h-screen bg-gradient-to-b from-white to-gray-50/80 backdrop-blur-md p-6 flex flex-col gap-6 shadow-2xl border-r border-gray-200/50 relative overflow-y-auto"
    >
      {/* Logo with hover effect */}
      <div className="flex items-center justify-center mb-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Image
            src="/images/mainlogo.png"
            alt="Company Logo"
            width={160}
            height={50}
            className="drop-shadow-lg"
          />
        </motion.div>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isБонз = item.label === "Бонз";
          const isRnd = item.label === "RnD";

          const subMenuItems = isБонз ? bonzSubMenu : isRnd ? rndSubMenu : [];

          const isOpen = !!openMenus[item.label];
          
          // Check if current path matches any submenu item
          const isActiveParent = subMenuItems.some((sub) => pathname === sub.href);

          if (isБонз || isRnd) {
            return (
              <div key={item.label} className="relative">
                <motion.button
                  type="button"
                  onClick={() => toggleMenu(item.label)}
                  aria-expanded={isOpen}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl w-full text-left transition-all duration-300 group ${
                    isActiveParent
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={20} 
                      className={`transition-all duration-300 ${
                        isActiveParent 
                          ? "text-white" 
                          : "text-gray-500 group-hover:text-blue-600"
                      }`} 
                    />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isOpen ? (
                      <ChevronDown 
                        size={18} 
                        className={isActiveParent ? "text-white" : "text-gray-500"} 
                      />
                    ) : (
                      <ChevronRight 
                        size={18} 
                        className={isActiveParent ? "text-white" : "text-gray-400"} 
                      />
                    )}
                  </motion.div>
                </motion.button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="flex flex-col ml-4 mt-2 gap-1 overflow-hidden border-l-2 border-gray-200 pl-2"
                    >
                      {subMenuItems.map((sub) => {
                        const activeSub = pathname === sub.href;
                        return (
                          <motion.div
                            key={sub.label}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Link
                              href={sub.href}
                              className={`px-4 py-2.5 rounded-lg block transition-all duration-300 relative overflow-hidden group ${
                                activeSub
                                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-sm border-l-4 border-blue-500"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                              }`}
                            >
                              {/* Hover effect background */}
                              <span className={`absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeSub ? "hidden" : ""}`}></span>
                              
                              {/* Text */}
                              <span className="relative z-10 flex items-center gap-2">
                                {activeSub && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-1.5 h-1.5 rounded-full bg-blue-600"
                                  />
                                )}
                                {sub.label}
                              </span>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const activeTop = item.href ? pathname === item.href || pathname.startsWith(item.href) : false;

          return (
            <motion.div
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.href ?? "#"}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 group relative overflow-hidden ${
                  activeTop 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30" 
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-md"
                }`}
              >
                {/* Hover effect background */}
                <span className={`absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTop ? "hidden" : ""}`}></span>
                
                {/* Icon and text */}
                <Icon 
                  size={20} 
                  className={`transition-all duration-300 z-10 ${
                    activeTop 
                      ? "text-white" 
                      : "text-gray-500 group-hover:text-blue-600"
                  }`} 
                />
                <span className={`z-10 ${activeTop ? "translate-x-1" : ""}`}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer with hover effect */}
      <motion.div 
        className="mt-auto pt-6 border-t border-gray-200 text-center text-sm text-gray-400"
        whileHover={{ scale: 1.02 }}
      >
        © 2025 <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Bodi Group</span>
      </motion.div>
    </motion.aside>
  );
}