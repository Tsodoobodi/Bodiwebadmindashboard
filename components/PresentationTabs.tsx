"use client";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { id: "research", label: "Судалгаа, сургалт, хамтын ажиллагаа", href: "/dashboard/rnd/presentation/research" },
  { id: "exchange", label: "Солилцооны хөтөлбөр", href: "/dashboard/rnd/presentation/exchange" },
  { id: "global", label: "Глобал түншлэл ба стратегийн хамтын ажиллагаа", href: "/dashboard/rnd/presentation/globalstrategy" },
  { id: "proffessional", label: "Мэргэжлийн сайн дурын ажил", href: "/dashboard/rnd/presentation/proffessional" },
];

export default function PresentationTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = tabs.find(tab => pathname.startsWith(tab.href))?.id || "research";

  return (
    <div className="flex gap-2 border-b mb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.href)}
          className={`px-4 py-2 ${activeTab === tab.id ? "border-b-2 border-blue-500 text-blue-600 font-bold" : "text-gray-600"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}