"use client";

import { useEffect, useState, useCallback } from "react";
import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Folder } from "lucide-react";

interface VideoNewsItem {
  id: string;
  title: string;
  youtube_url: string;
  description?: string;
  status: boolean;
  viewers: number;
  position: boolean;
  is_research: boolean;
  created_at: string;
  updated_at?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net";

const ITEMS_PER_PAGE = 9;

// ---- Shared glass tokens (matching Dashboard / Sidebar / Header / News page) ----
const GLASS_PANEL =
  "rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]";
const GLASS_INPUT =
  "bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/25 focus-visible:border-white/30";
const GLASS_TRIGGER =
  "bg-white/5 border-white/15 text-white data-[placeholder]:text-white/40 focus:ring-white/25";
const GLASS_CONTENT = "bg-black/80 backdrop-blur-2xl border-white/15 text-white";
const GLASS_ITEM = "text-white/80 focus:bg-white/10 focus:text-white";
const GLASS_OUTLINE_BTN =
  "border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white";

// ---- Light tokens, used only inside the video editor modal (typing over glass is hard to read) ----
const LIGHT_INPUT = "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400";
const LIGHT_OUTLINE_BTN = "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900";
const LIGHT_CHECKBOX = "border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600";

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [jumpValue, setJumpValue] = useState("");

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  const handleJump = () => {
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpValue("");
    }
  };

  const handleJumpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleJump();
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 pt-2 p-3 ${GLASS_PANEL}`}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        className={GLASS_OUTLINE_BTN}
      >
        Эхлэл
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={GLASS_OUTLINE_BTN}
      >
        Өмнөх
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-white/35">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              className={
                p === currentPage
                  ? "w-9 bg-blue-500 hover:bg-blue-500/90 text-white shadow-[0_0_16px_rgba(59,130,246,0.45)]"
                  : `w-9 ${GLASS_OUTLINE_BTN}`
              }
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={GLASS_OUTLINE_BTN}
      >
        Дараагийн
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        className={GLASS_OUTLINE_BTN}
      >
        Төгсгөл
      </Button>

      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/15">
        <span className="text-xs text-white/40 whitespace-nowrap">Хуудас:</span>
        <Input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={handleJumpKeyDown}
          placeholder={`${currentPage}`}
          className={`w-16 h-8 text-xs text-center ${GLASS_INPUT}`}
        />
        <span className="text-xs text-white/40">/ {totalPages}</span>
        <Button size="sm" variant="outline" className={`h-8 text-xs ${GLASS_OUTLINE_BTN}`} onClick={handleJump}>
          Очих
        </Button>
      </div>
    </div>
  );
}

export default function VideoNewsPage() {
  const [videoNews, setVideoNews] = useState<VideoNewsItem[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState(true);
  const [newPosition, setNewPosition] = useState(false);
  const [newIsResearch, setNewIsResearch] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchVideoNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/video-news`);
      const data = res.data.data || res.data;
      setVideoNews(data);
    } catch (err) {
      console.error("Fetch video news error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideoNews();
  }, [fetchVideoNews]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, startDate, endDate]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Та устгахдаа итгэлтэй байна уу?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/api/video-news/${id}`);
      setVideoNews(videoNews.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSave = async () => {
    try {
      if (!newTitle || !newYoutubeUrl) {
        alert("Гарчиг болон YouTube URL оруулна уу!");
        return;
      }

      if (!extractYouTubeId(newYoutubeUrl)) {
        alert("Зөв YouTube URL оруулна уу!");
        return;
      }

      const payload = {
        title: newTitle,
        youtube_url: newYoutubeUrl,
        description: newDescription,
        status: newStatus,
        position: newPosition,
        is_research: newIsResearch,
      };

      if (editId) {
        const res = await axios.put(`${API_URL}/api/video-news/${editId}`, payload);
        const updatedItem = res.data.data || res.data;
        setVideoNews(videoNews.map((item) => (item.id === editId ? updatedItem : item)));
      } else {
        const res = await axios.post(`${API_URL}/api/video-news`, payload);
        const newItem = res.data.data || res.data;
        setVideoNews([newItem, ...videoNews]);
      }

      setOpen(false);
      setNewTitle("");
      setNewYoutubeUrl("");
      setNewDescription("");
      setNewStatus(true);
      setNewPosition(false);
      setNewIsResearch(true);
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Алдаа гарлаа. Console-г шалгана уу.");
    }
  };

  const filtered = videoNews.filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ? true :
      statusFilter === "active" ? item.status === true :
      statusFilter === "inactive" ? item.status === false : true;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(item.created_at) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(item.created_at) <= new Date(endDate);
    }

    return matchesQuery && matchesStatus && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleResetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* FILTERS */}
      <div className={`flex flex-wrap items-center gap-4 sticky top-0 z-10 p-4 ${GLASS_PANEL}`}>
        <Input
          type="text"
          placeholder="Видео хайх..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-[300px] ${GLASS_INPUT}`}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={`w-[180px] ${GLASS_TRIGGER}`}>
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className={GLASS_CONTENT}>
            <SelectItem value="all" className={GLASS_ITEM}>Бүгд</SelectItem>
            <SelectItem value="active" className={GLASS_ITEM}>Идэвхтэй</SelectItem>
            <SelectItem value="inactive" className={GLASS_ITEM}>Идэвхгүй</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Label className="text-white/70">Эхлэх:</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-[160px] ${GLASS_INPUT}`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-white/70">Дуусах:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-[160px] ${GLASS_INPUT}`}
          />
        </div>

        <Button variant="outline" onClick={handleResetFilters} className={GLASS_OUTLINE_BTN}>
          Шүүлтүүр цэвэрлэх
        </Button>

        <Button
          onClick={() => {
            setOpen(true);
            setEditId(null);
            setNewTitle("");
            setNewYoutubeUrl("");
            setNewDescription("");
            setNewStatus(true);
            setNewPosition(false);
            setNewIsResearch(true);
          }}
          className="ml-auto bg-blue-500/90 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]"
        >
          + Шинэ видео нэмэх
        </Button>

        <span className="text-sm text-white/45 ml-auto">
          {filtered.length} / {videoNews.length} мэдээ
        </span>
      </div>

      {/* Video Grid */}
      {loading ? (
        <p className="text-center text-white/45 py-10">Уншиж байна...</p>
      ) : filtered.length === 0 ? (
        <div className={`py-10 ${GLASS_PANEL}`}>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white/10 text-white/60">
                <Folder />
              </EmptyMedia>
              <EmptyTitle className="text-white">Мэдээ олдсонгүй</EmptyTitle>
              <EmptyDescription className="text-white/45">
                Та одоогоор ямар ч видео мэдээ үүсгээгүй байна.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => {
              const videoId = extractYouTubeId(item.youtube_url);
              const thumbnailUrl = videoId
                ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                : null;

              return (
                <div
                  key={item.id}
                  className={`overflow-hidden transition-all duration-200 flex flex-col hover:-translate-y-1 hover:bg-white/[0.08] ${GLASS_PANEL}`}
                >
                  {thumbnailUrl && (
                    <div className="relative w-full h-32 group overflow-hidden">
                      <Image
                        width={500}
                        height={300}
                        src={thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-sm line-clamp-1 text-white">{item.title}</h3>
                      <div className="flex gap-1 shrink-0">
                        {item.position && (
                          <span className="text-[10px] bg-amber-400/80 px-1.5 py-0.5 rounded text-white">⭐</span>
                        )}
                        {item.is_research && (
                          <span className="text-[10px] bg-blue-500/80 px-1.5 py-0.5 rounded text-white">🔬</span>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-white/50 line-clamp-2 mb-1.5">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[11px] text-white/40 mb-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/10">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.status ? "bg-emerald-500/80 text-white" : "bg-white/15 text-white/70"
                        }`}
                      >
                        {item.status ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                      <span className="text-[10px] text-white/40">👁 {item.viewers}</span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOpen(true);
                          setEditId(item.id);
                          setNewTitle(item.title);
                          setNewYoutubeUrl(item.youtube_url);
                          setNewDescription(item.description || "");
                          setNewStatus(item.status);
                          setNewPosition(item.position);
                          setNewIsResearch(item.is_research);
                        }}
                        className={`flex-1 h-8 text-xs cursor-pointer ${GLASS_OUTLINE_BTN}`}
                      >
                        Засах
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 h-8 text-xs cursor-pointer bg-red-500/80 hover:bg-red-500 text-white cursor-pointer"
                      >
                        Устгах
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Modal — kept a plain white surface, same as the news editor, since typing over glass is hard to read */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editId ? "Видео Засах" : "Видео Нэмэх"}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setEditId(null);
                }}
                className={LIGHT_OUTLINE_BTN}
              >
                X
              </Button>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-auto">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Гарчиг *</label>
                <Input
                  placeholder="Видео гарчиг"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={LIGHT_INPUT}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">YouTube URL *</label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                  className={LIGHT_INPUT}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Тайлбар</label>
                <Textarea
                  placeholder="Видеоны тайлбар..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  className={LIGHT_INPUT}
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={newStatus}
                    onCheckedChange={(checked) => setNewStatus(checked as boolean)}
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="status" className="text-gray-700">Идэвхтэй</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="position"
                    checked={newPosition}
                    onCheckedChange={(checked) => setNewPosition(checked as boolean)}
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="position" className="text-gray-700">Онцолсон</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_research"
                    checked={newIsResearch}
                    onCheckedChange={(checked) => setNewIsResearch(checked as boolean)}
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="is_research" className="text-gray-700">Судалгаа</Label>
                </div>
              </div>

              {newYoutubeUrl && extractYouTubeId(newYoutubeUrl) && (
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Урьдчилан харах</label>
                  <div className="aspect-video w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(newYoutubeUrl)}`}
                      title="YouTube video preview"
                      frameBorder="0"
                      allowFullScreen
                      className="rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setEditId(null);
                }}
                className={LIGHT_OUTLINE_BTN}
              >
                Болих
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                {editId ? "Шинэчлэх" : "Нэмэх"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}