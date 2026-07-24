"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];
const STATUS_COLORS = { active: "#22c55e", inactive: "#94a3b8" };

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
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${accent}15` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
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

  // Content type breakdown (bar chart)
  const contentByType = [
    { name: "Мэдээ", count: news.length },
    { name: "Байгаль", count: nature.length },
    { name: "Засаглал", count: development.length },
    { name: "Нийгэм", count: person.length },
    { name: "Судалгаа", count: research.length },
    { name: "Хамтын ажиллагаа", count: rndpartner.length },
    { name: "Видео", count: videoNews.length },
  ];

  // Status pie chart
  const statusData = [
    { name: "Идэвхтэй", value: activeCount },
    { name: "Идэвхгүй", value: inactiveCount },
  ];

  // Language breakdown (news only, since it has language field)
  const languageData = useMemo(() => {
    const mn = news.filter((n) => n.language === "mn").length;
    const en = news.filter((n) => n.language === "en").length;
    return [
      { name: "Монгол", value: mn },
      { name: "English", value: en },
    ];
  }, [news]);

  // Monthly trend (last 6 months, based on created_at)
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
        <p className="text-gray-400 text-sm">Ачааллаж байна...</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Хяналтын самбар</h1>
        <p className="text-sm text-gray-500">Нийт контентын тойм болон статистик</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Нийт мэдээ" value={totalNews} icon={Newspaper} accent="#3b82f6" />
        <MetricCard label="Видео мэдээ" value={totalVideos} icon={Video} accent="#ef4444" />
        <MetricCard label="Нийт vзэлт" value={totalViews.toLocaleString()} icon={Eye} accent="#22c55e" />
        <MetricCard label="Идэвхтэй" value={activeCount} icon={TrendingUp} accent="#a855f7" />
        <MetricCard label="Санал асуулга" value={surveyCount} icon={ClipboardList} accent="#f59e0b" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-xl border-gray-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Сарын мэдээний тоо (сvvлийн 6 сар)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Мэдээ"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-gray-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Төлөвийн харьцаа</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  <Cell fill={STATUS_COLORS.active} />
                  <Cell fill={STATUS_COLORS.inactive} />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-xl border-gray-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Ангилал бvрийн мэдээний тоо
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {contentByType.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-gray-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Хэлний харьцаа (мэдээ)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#22c55e" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}