"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  { id: "research", label: "Судалгаа, сургалт, хамтын ажиллагаа", href: "/dashboard/rnd/presentation/research" },
  { id: "exchange", label: "Солилцооны хөтөлбөр", href: "/dashboard/rnd/presentation/exchange" },
  { id: "global", label: "Глобал түншлэл ба стратегийн хамтын ажиллагаа", href: "/dashboard/rnd/presentation/globalstrategy" },
  { id: "volunteer", label: "Мэргэжлийн сайн дурын ажил", href: "/dashboard/rnd/presentation/proffessional" },
];

export default function PresentationTabs() {
  const pathname = usePathname();
  const router = useRouter();

  // URL-аас active tab тодорхойлно
  const activeTab = tabs.find(tab => pathname.startsWith(tab.href))?.id || "research";

  const handleTabClick = (href: string) => {
    if (href !== pathname) {
      router.push(href); // Page руу navigate
    }
  };

  return (
    <div className="w-full h-full bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-lg">
      {/* Tabs Header */}
      <div className="flex flex-wrap gap-3 border-b border-gray-200 mb-6 relative">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.href)}
            className={`relative px-4 py-2 font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tabs Content Placeholder */}
      <div className="mt-4 text-gray-700 leading-relaxed">
        <p>
          Энэ хэсэг нь тухайн tab-ийн page.tsx-д render хийгдэх контентыг
          төлөөлж байна. Үнэндээ, click хийхэд Next.js нь тухайн URL-ийн
          `page.tsx`-г load хийнэ.
        </p>
      </div>
    </div>
  );
}
