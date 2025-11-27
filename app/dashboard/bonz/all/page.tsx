"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface NewsItem {
  id: string;
  title: string;
  contents: Record<string, unknown> | string;
  created_at: string;
  updated_at?: string;
  category: "development" | "nature" | "news";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net";

export default function AllNewsPage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

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
      
      // Гурван API-г зэрэг дуудах
      const [devRes, natureRes, newsRes] = await Promise.all([
        axios.get(`${API_URL}/api/development`),
        axios.get(`${API_URL}/api/nature`),
        axios.get(`${API_URL}/api/person`),
      ]);

      // Development
      const devData = (devRes.data.data || devRes.data).map((item: NewsItem) => ({
        ...item,
        category: "development" as const,
        contents: typeof item.contents === "object" 
          ? jsonToHTML(item.contents as Record<string, unknown>)
          : item.contents,
      }));

      // Nature
      const natureData = (natureRes.data.data || natureRes.data).map((item: NewsItem) => ({
        ...item,
        category: "nature" as const,
        contents: typeof item.contents === "object" 
          ? jsonToHTML(item.contents as Record<string, unknown>)
          : item.contents,
      }));

      // News
      const newsData = (newsRes.data.data || newsRes.data).map((item: NewsItem) => ({
        ...item,
        category: "news" as const,
        contents: typeof item.contents === "object" 
          ? jsonToHTML(item.contents as Record<string, unknown>)
          : item.contents,
      }));

      // Нэгтгэж, огноогоор эрэмбэлэх
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
        return "bg-blue-500";
      case "nature":
        return "bg-green-500";
      case "news":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
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

  // Filter
  const filteredNews = allNews.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Бүх мэдээ</h1>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Мэдээ хайх..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md p-2 rounded-xl border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            size="sm"
          >
            Бүгд ({allNews.length})
          </Button>
          <Button
            variant={selectedCategory === "development" ? "default" : "outline"}
            onClick={() => setSelectedCategory("development")}
            size="sm"
          >
            Хөгжил ({allNews.filter(n => n.category === "development").length})
          </Button>
          <Button
            variant={selectedCategory === "nature" ? "default" : "outline"}
            onClick={() => setSelectedCategory("nature")}
            size="sm"
          >
            Байгаль ({allNews.filter(n => n.category === "nature").length})
          </Button>
          <Button
            variant={selectedCategory === "news" ? "default" : "outline"}
            onClick={() => setSelectedCategory("news")}
            size="sm"
          >
            Хүн ({allNews.filter(n => n.category === "news").length})
          </Button>
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <p className="text-center text-muted-foreground">Уншиж байна ...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNews.map((item) => {
            const htmlContent = typeof item.contents === "string" ? item.contents : "";
            const images = extractImagesFromHTML(htmlContent);
            const firstImg = images.length > 0 ? images[0] : null;
            const textPreview = extractTextFromHTML(htmlContent);

            return (
              <div
                key={`${item.category}-${item.id}`}
                className="bg-card rounded-2xl shadow-md overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl h-[400px]"
              >
                {/* Category Badge */}
                <div className="relative">
                  {firstImg && (
                    <Image
                      width={200}
                      height={150}
                      src={firstImg}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <span className={`absolute top-2 right-2 ${getCategoryColor(item.category)} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                    {getCategoryLabel(item.category)}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold line-clamp-2 mb-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(item.created_at).toLocaleDateString("mn-MN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {textPreview}
                    </p>
                  </div>

                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    variant="outline"
                  >
                    Дэлгэрэнгүй
                  </Button>
                </div>
              </div>
            );
          })}
          {filteredNews.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">
              Мэдээ олдсонгүй.
            </p>
          )}
        </div>
      )}
    </div>
  );
}