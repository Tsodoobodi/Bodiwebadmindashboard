"use client";

import { useEffect, useState, useCallback } from "react";
import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface VideoNewsItem {
  id: string;
  title: string;
  youtube_url: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// YouTube Video ID гаргах
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export default function VideoNewsPage() {
  const [videoNews, setVideoNews] = useState<VideoNewsItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");

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

      // YouTube URL validation
      if (!extractYouTubeId(newYoutubeUrl)) {
        alert("Зөв YouTube URL оруулна уу! (Жишээ: https://www.youtube.com/watch?v=VIDEO_ID)");
        return;
      }

      const payload: {
        title: string;
        youtube_url: string;
        description: string;
        updated_at?: string;
      } = {
        title: newTitle,
        youtube_url: newYoutubeUrl,
        description: newDescription,
      };

      // Edit mode дээр огноо өөрчлөх
      if (editId && editDate) {
        payload.updated_at = new Date(editDate).toISOString();
      }

      if (editId) {
        // Edit mode
        const res = await axios.put(
          `${API_URL}/api/video-news/${editId}`,
          payload
        );
        const updatedItem = res.data.data || res.data;
        setVideoNews(
          videoNews.map((item) =>
            item.id === editId ? updatedItem : item
          )
        );
      } else {
        // Add mode
        const res = await axios.post(`${API_URL}/api/video-news`, payload);
        const newItem = res.data.data || res.data;
        setVideoNews([newItem, ...videoNews]);
      }

      setOpen(false);
      setNewTitle("");
      setNewYoutubeUrl("");
      setNewDescription("");
      setEditId(null);
      setEditDate("");
    } catch (err) {
      console.error("Save error:", err);
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "Алдаа гарлаа");
      } else {
        alert("Алдаа гарлаа. Console-г шалгана уу.");
      }
    }
  };

  const filteredVideoNews = videoNews.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Search + Add */}
      <div className="flex gap-8 items-center mb-4">
        <input
          type="text"
          placeholder=" Видео мэдээ хайх ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-[500px] p-2 rounded-xl border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <Button
          className="bg-none rounded-xl w-[200px] h-10 text-md border border-gray-500 hover:bg-gray-500 hover:text-white transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => {
            setOpen(true);
            setEditId(null);
            setNewTitle("");
            setNewYoutubeUrl("");
            setNewDescription("");
            setEditDate("");
          }}
        >
          + Шинэ видео нэмэх
        </Button>
      </div>

      {/* Video News Grid */}
      {loading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideoNews.map((item) => {
            const videoId = extractYouTubeId(item.youtube_url);
            const thumbnailUrl = videoId
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              : null;

            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl shadow-md overflow-hidden 
                  flex flex-col transition-all duration-300 ease-in-out 
                  hover:shadow-xl"
              >
                {/* YouTube Thumbnail */}
                {thumbnailUrl && (
                  <div className="relative w-full h-48 bg-gray-200">
                    <Image
                      width={500}
                      height={400}
                      src={thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition">
                        <svg
                          className="w-8 h-8 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Оруулсан: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.updated_at && (
                      <p className="text-xs text-green-600">
                        Шинэчилсэн:{" "}
                        {new Date(item.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOpen(true);
                        setEditId(item.id);
                        setNewTitle(item.title);
                        setNewYoutubeUrl(item.youtube_url);
                        setNewDescription(item.description || "");
                        setEditDate(
                          item.updated_at
                            ? item.updated_at.slice(0, 10)
                            : item.created_at.slice(0, 10)
                        );
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredVideoNews.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              Видео мэдээ олдсонгүй.
            </p>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl rounded-2xl shadow-xl p-6 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editId ? "Видео Засах" : "Видео Нэмэх"}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setEditId(null);
                }}
              >
                X
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-4 overflow-auto">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Гарчиг *
                </label>
                <Input
                  placeholder="Видео гарчиг"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  YouTube URL *
                </label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Жишээ: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Тайлбар
                </label>
                <Textarea
                  placeholder="Видеоны тайлбар..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {editId && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Огноо өөрчлөх
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2 rounded border bg-background"
                  />
                </div>
              )}

              {/* Preview */}
              {newYoutubeUrl && extractYouTubeId(newYoutubeUrl) && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Урьдчилан харах
                  </label>
                  <div className="aspect-video w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(
                        newYoutubeUrl
                      )}`}
                      title="YouTube video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setEditId(null);
                }}
              >
                Болих
              </Button>
              <Button onClick={handleSave}>
                {editId ? "Шинэчлэх" : "Нэмэх"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}