"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Newspaper, Video, Eye, TrendingUp, ClipboardList } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net";

interface ContentItem {
  id: string;
  status?: boolean;
  viewers?: number;
  language?: string;
  created_at: string;
}

// ---- Palette (glassy, tuned for a photographic background) ----
const ACCENTS = {
  blue: "#60a5fa",
  green: "#34d399",
  amber: "#fbbf24",
  violet: "#c084fc",
  red: "#f87171",
  teal: "#2dd4bf",
};
const COLORS = [ACCENTS.blue, ACCENTS.green, ACCENTS.amber, ACCENTS.violet, ACCENTS.red, ACCENTS.teal];
const STATUS_COLORS = { active: ACCENTS.green, inactive: "rgba(255,255,255,0.25)" };

// ---- Shared glass shell ----
function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "relative rounded-[28px] border border-white/15 bg-white/[0.06] backdrop-blur-2xl " +
        "shadow-[0_8px_40px_rgba(0,0,0,0.45)] before:pointer-events-none before:absolute before:inset-0 " +
        "before:rounded-[28px] before:bg-gradient-to-br before:from-white/[0.10] before:to-transparent " +
        "before:opacity-60 " +
        className
      }
    >
      <div className="relative">{children}</div>
    </div>
  );
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-xl px-3 py-2 shadow-lg">
      {label && <p className="text-[11px] font-medium text-white/70 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color || p.fill }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <GlassPanel className="p-4 flex items-center gap-3 transition-transform duration-300 hover:-translate-y-1 hover:bg-white/[0.09]">
      <div
        className="p-2.5 rounded-xl ring-1 ring-inset"
        style={{
          backgroundColor: `${accent}22`,
          boxShadow: `0 0 24px ${accent}33`,
          borderColor: `${accent}55`,
        }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-white/60">{label}</p>
      </div>
    </GlassPanel>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassPanel className={"p-5 flex flex-col gap-3 " + className}>
      <div>
        <h3 className="text-sm font-semibold text-white/90 tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-white/45 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </GlassPanel>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<ContentItem[]>([]);
  const [videoNews, setVideoNews] = useState<ContentItem[]>([]);
  const [nature, setNature] = useState<ContentItem[]>([]);
  const [development, setDevelopment] = useState<ContentItem[]>([]);
  const [person, setPerson] = useState<ContentItem[]>([]);
  const [research, setResearch] = useState<ContentItem[]>([]);
  const [rndpartner, setRndpartner] = useState<ContentItem[]>([]);
  const [surveyCount, setSurveyCount] = useState(0);

  const extractArray = (res: { data: { data?: ContentItem[] } | ContentItem[] }) =>
    Array.isArray(res.data) ? res.data : res.data.data || [];

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const endpoints = [
        "/api/news",
        "/api/video-news",
        "/api/nature",
        "/api/development",
        "/api/person",
        "/api/research",
        "/api/rndpartner",
      ];

      const results = await Promise.allSettled(
        endpoints.map((ep) => axios.get(`${API_URL}${ep}`))
      );

      const [newsRes, videoRes, natureRes, devRes, personRes, researchRes, partnerRes] = results;

      setNews(newsRes.status === "fulfilled" ? extractArray(newsRes.value) : []);
      setVideoNews(videoRes.status === "fulfilled" ? extractArray(videoRes.value) : []);
      setNature(natureRes.status === "fulfilled" ? extractArray(natureRes.value) : []);
      setDevelopment(devRes.status === "fulfilled" ? extractArray(devRes.value) : []);
      setPerson(personRes.status === "fulfilled" ? extractArray(personRes.value) : []);
      setResearch(researchRes.status === "fulfilled" ? extractArray(researchRes.value) : []);
      setRndpartner(partnerRes.status === "fulfilled" ? extractArray(partnerRes.value) : []);

      try {
        const surveyRes = await axios.get(`${API_URL}/api/surveys/stats`);
        setSurveyCount(surveyRes.data?.total ?? 0);
      } catch {
        setSurveyCount(0);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const allContent = useMemo(
    () => [...news, ...nature, ...development, ...person, ...research, ...rndpartner],
    [news, nature, development, person, research, rndpartner]
  );

  const totalNews = allContent.length;
  const totalVideos = videoNews.length;
  const totalViews = useMemo(
    () => allContent.reduce((sum, item) => sum + (item.viewers || 0), 0),
    [allContent]
  );
  const activeCount = useMemo(
    () => allContent.filter((item) => item.status === true).length,
    [allContent]
  );
  const inactiveCount = totalNews - activeCount;

  const contentByType = [
    { name: "Мэдээ", count: news.length },
    { name: "Байгаль", count: nature.length },
    { name: "Засаглал", count: development.length },
    { name: "Нийгэм", count: person.length },
    { name: "Судалгаа", count: research.length },
    { name: "Хамтын ажиллагаа", count: rndpartner.length },
    { name: "Видео", count: videoNews.length },
  ];

  const statusData = [
    { name: "Идэвхтэй", value: activeCount },
    { name: "Идэвхгүй", value: inactiveCount },
  ];

  const languageData = useMemo(() => {
    const mn = news.filter((n) => n.language === "mn").length;
    const en = news.filter((n) => n.language === "en").length;
    return [
      { name: "Монгол", value: mn },
      { name: "English", value: en },
    ];
  }, [news]);

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString("mn-MN", { month: "short" });
      months.push({ key, label, count: 0 });
    }
    allContent.forEach((item) => {
      const d = new Date(item.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const match = months.find((m) => m.key === key);
      if (match) match.count += 1;
    });
    return months;
  }, [allContent]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <GlassPanel className="px-6 py-4">
          <p className="text-white/70 text-sm">Ачааллаж байна...</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Хяналтын самбар</h1>
        <p className="text-sm text-white/55">Нийт контентын тойм болон статистик</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Нийт мэдээ" value={totalNews} icon={Newspaper} accent={ACCENTS.blue} />
        <MetricCard label="Видео мэдээ" value={totalVideos} icon={Video} accent={ACCENTS.red} />
        <MetricCard label="Нийт vзэлт" value={totalViews.toLocaleString()} icon={Eye} accent={ACCENTS.green} />
        <MetricCard label="Идэвхтэй" value={activeCount} icon={TrendingUp} accent={ACCENTS.violet} />
        <MetricCard label="Санал асуулга" value={surveyCount} icon={ClipboardList} accent={ACCENTS.amber} />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Сарын мэдээний тоо"
          subtitle="Сvvлийн 6 сар"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENTS.blue} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={ACCENTS.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Мэдээ"
                stroke={ACCENTS.blue}
                strokeWidth={2.5}
                fill="url(#trendFill)"
                dot={{ r: 3, fill: ACCENTS.blue, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: ACCENTS.blue, stroke: "rgba(255,255,255,0.4)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Төлөвийн харьцаа">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={ACCENTS.green} />
                  <stop offset="100%" stopColor={ACCENTS.teal} />
                </linearGradient>
              </defs>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={4}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={2}
              >
                <Cell fill="url(#activeGrad)" />
                <Cell fill={STATUS_COLORS.inactive} />
              </Pie>
              <Tooltip content={<GlassTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-white/70">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Ангилал бvрийн мэдээний тоо" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contentByType}>
              <defs>
                {COLORS.map((c, i) => (
                  <linearGradient id={`barGrad${i}`} key={i} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.45)"
                fontSize={11}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {contentByType.map((_, index) => (
                  <Cell key={index} fill={`url(#barGrad${index % COLORS.length})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Хэлний харьцаа" subtitle="Мэдээ">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <linearGradient id="mnGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={ACCENTS.blue} />
                  <stop offset="100%" stopColor={ACCENTS.violet} />
                </linearGradient>
                <linearGradient id="enGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={ACCENTS.green} />
                  <stop offset="100%" stopColor={ACCENTS.teal} />
                </linearGradient>
              </defs>
              <Pie
                data={languageData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={4}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={2}
              >
                <Cell fill="url(#mnGrad)" />
                <Cell fill="url(#enGrad)" />
              </Pie>
              <Tooltip content={<GlassTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-white/70">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}