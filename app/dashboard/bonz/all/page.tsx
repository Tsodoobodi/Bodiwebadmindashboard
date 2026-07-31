"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";

interface NewsItem {
  id: string;
  title: string;
  contents: Record<string, unknown> | string;
  created_at: string;
  updated_at?: string;
  category: "development" | "nature" | "news";
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net";

const ITEMS_PER_PAGE = 9;

// ---- Shared glass tokens (matching Dashboard / Sidebar / Header / News / VideoNews pages) ----
const GLASS_PANEL =
  "rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]";
const GLASS_OUTLINE_BTN =
  "border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white";
const GLASS_ACTIVE_BTN =
  "bg-blue-500 hover:bg-blue-500/90 text-white shadow-[0_0_16px_rgba(59,130,246,0.45)] border-transparent";

export default function AllNewsPage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const jsonToHTML = (json: Record<string, unknown>): string => {
    if (typeof json === "object" && json.content && Array.isArray(json.content)) {
      const htmlNode = json.content.find(
        (node: Record<string, unknown>) => node.type === "html" && node.html
      ) as { html?: string } | undefined;
      if (htmlNode?.html) return htmlNode.html;
    }
    return typeof json === "string" ? json : "";
  };

  const fetchAllNews = useCallback(async () => {
    try {
      setLoading(true);

      const [devRes, natureRes, newsRes] = await Promise.all([
        axios.get(`${API_URL}/api/development`),
        axios.get(`${API_URL}/api/nature`),
        axios.get(`${API_URL}/api/person`),
      ]);

      const devData = (devRes.data.data || devRes.data).map((item: NewsItem) => ({
        ...item,
        category: "development" as const,
        contents:
          typeof item.contents === "object"
            ? jsonToHTML(item.contents as Record<string, unknown>)
            : item.contents,
      }));

      const natureData = (natureRes.data.data || natureRes.data).map((item: NewsItem) => ({
        ...item,
        category: "nature" as const,
        contents:
          typeof item.contents === "object"
            ? jsonToHTML(item.contents as Record<string, unknown>)
            : item.contents,
      }));

      const newsData = (newsRes.data.data || newsRes.data).map((item: NewsItem) => ({
        ...item,
        category: "news" as const,
        contents:
          typeof item.contents === "object"
            ? jsonToHTML(item.contents as Record<string, unknown>)
            : item.contents,
      }));

      const combined = [...devData, ...natureData, ...newsData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAllNews(combined);
    } catch (err) {
      console.error("Fetch all news error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, query]);

  const extractImagesFromHTML = (html: string): string[] => {
    if (typeof html !== "string") return [];
    const regex = /<img[^>]+src=["']([^"']+)["']/g;
    const images: string[] = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      images.push(match[1]);
    }
    return images;
  };

  const extractTextFromHTML = (html: string): string => {
    if (typeof html !== "string") return "";
    return html.replace(/<[^>]+>/g, "").trim();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "development":
        return "bg-blue-500/90";
      case "nature":
        return "bg-emerald-500/90";
      case "news":
        return "bg-violet-500/90";
      default:
        return "bg-white/20";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "development":
        return "Хөгжил";
      case "nature":
        return "Байгаль";
      case "news":
        return "Хүн";
      default:
        return category;
    }
  };

  const filteredNews = allNews.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / ITEMS_PER_PAGE));
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className={`flex flex-col gap-4 p-5 ${GLASS_PANEL}`}>
        <h1 className="text-3xl font-bold text-white tracking-tight">Бүх мэдээ</h1>

        <input
          type="text"
          placeholder="Мэдээ хайх..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md p-2 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/30 transition"
        />

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            size="sm"
            className={selectedCategory === "all" ? GLASS_ACTIVE_BTN : GLASS_OUTLINE_BTN}
          >
            Бүгд ({allNews.length})
          </Button>
          <Button
            variant={selectedCategory === "development" ? "default" : "outline"}
            onClick={() => setSelectedCategory("development")}
            size="sm"
            className={selectedCategory === "development" ? GLASS_ACTIVE_BTN : GLASS_OUTLINE_BTN}
          >
            Хөгжил ({allNews.filter((n) => n.category === "development").length})
          </Button>
          <Button
            variant={selectedCategory === "nature" ? "default" : "outline"}
            onClick={() => setSelectedCategory("nature")}
            size="sm"
            className={selectedCategory === "nature" ? GLASS_ACTIVE_BTN : GLASS_OUTLINE_BTN}
          >
            Байгаль ({allNews.filter((n) => n.category === "nature").length})
          </Button>
          <Button
            variant={selectedCategory === "news" ? "default" : "outline"}
            onClick={() => setSelectedCategory("news")}
            size="sm"
            className={selectedCategory === "news" ? GLASS_ACTIVE_BTN : GLASS_OUTLINE_BTN}
          >
            Хүн ({allNews.filter((n) => n.category === "news").length})
          </Button>
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <p className="text-center text-white/45">Уншиж байна ...</p>
      ) : filteredNews.length === 0 ? (
        <p className={`text-center text-white/45 py-8 ${GLASS_PANEL}`}>Мэдээ олдсонгүй.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedNews.map((item) => {
              const htmlContent = typeof item.contents === "string" ? item.contents : "";
              const images = extractImagesFromHTML(htmlContent);
              const firstImg = images.length > 0 ? images[0] : null;
              const textPreview = extractTextFromHTML(htmlContent);

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  className={`overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.08] ${GLASS_PANEL}`}
                >
                  <div className="relative">
                    {firstImg ? (
                      <Image
                        width={200}
                        height={120}
                        src={firstImg}
                        alt={item.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-white/[0.03] flex items-center justify-center text-white/30 text-xs">
                        No image
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 ${getCategoryColor(
                        item.category
                      )} text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm`}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1.5 text-white">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-white/40 mb-1.5">
                        {new Date(item.created_at).toLocaleDateString("mn-MN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-white/50 line-clamp-2">
                        {textPreview}
                      </p>
                    </div>

                    <Button
                      className={`mt-3 w-full h-8 text-xs ${GLASS_OUTLINE_BTN}`}
                      size="sm"
                      variant="outline"
                    >
                      Дэлгэрэнгүй
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {filteredNews.length > ITEMS_PER_PAGE && (
            <div className={`p-3 ${GLASS_PANEL}`}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}