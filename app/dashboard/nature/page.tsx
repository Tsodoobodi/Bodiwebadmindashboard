"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  images?: string[]; // олон зураг
  created_at: string;
  updated_at?: string;
}

export default function NaturePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5001/api/nature", {
        headers: { "Cache-Control": "no-cache" },
      });
      setNews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Та устгахдаа итгэлтэй байна уу?");
    if (!confirmed) return;
    try {
      await axios.delete(`http://localhost:5001/api/nature/${id}`);
      setNews(news.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // HTML-с зурагнуудыг гаргах helper
  const extractImages = (html: string): string[] => {
    const regex = /<img[^>]+src=["']([^"']+)["']/g;
    let matches;
    const urls: string[] = [];
    while ((matches = regex.exec(html)) !== null) {
      urls.push(matches[1]);
    }
    return urls;
  };

  const handleSave = async () => {
    try {
      const images = extractImages(newDescription);
      if (editId) {
        // Edit mode
        interface NewsPayload {
          title: string;
          description: string;
          images: string[];
          is_research: boolean;
          meta: Record<string, unknown>;
          updated_at?: string;
        }
        const payload: NewsPayload = {
          title: newTitle,
          description: newDescription,
          images,
          is_research: false,
          meta: {},
        };
        // Хэрвээ editDate өөрчлөгдсөн бол updated_at-д илгээнэ
        if (editDate) {
          payload.updated_at = new Date(editDate).toISOString();
        }
        const res = await axios.put(
          `http://localhost:5001/api/nature/${editId}`,
          payload
        );
        setNews(news.map((item) => (item.id === editId ? res.data : item)));
      } else {
        // Add mode
        const res = await axios.post("http://localhost:5001/api/nature", {
          title: newTitle,
          description: newDescription,
          images,
          is_research: false,
          meta: {},
        });
        setNews([res.data, ...news]);
      }

      setOpen(false);
      setNewTitle("");
      setNewDescription("");
      setEditId(null);
      setEditDate("");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Search + Add */}
      <div className="flex items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Мэдээ хайх ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-[300px] p-2 rounded-xl border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <Button
          className="rounded-xl"
          onClick={() => {
            setOpen(true);
            setEditId(null);
            setNewTitle("");
            setNewDescription("");
            setEditDate("");
          }}
        >
          + Мэдээ нэмэх
        </Button>
      </div>

      {/* News Grid */}
      {loading ? (
        <p className="text-center text-muted-foreground">Loading news...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item) => {
            // Thumbnail авах
            const firstImg =
              item.images && item.images.length > 0 ? item.images[0] : null;

            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl shadow-md overflow-hidden 
                  cursor-pointer flex flex-col transition-all duration-300 ease-in-out 
                  hover:scale-100 hover:shadow-xl h-[400px]"
              >
                {firstImg && (
                  <Image
                    width={200}
                    height={150}
                    src={firstImg}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                )}

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Оруулсан: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.updated_at && (
                      <p className="text-xs text-green-600 mt-1">
                        Сүүлд шинэчилсэн:{" "}
                        {new Date(item.updated_at).toLocaleDateString()}
                      </p>
                    )}

                    {/* Description truncate */}
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {item.description.replace(/<[^>]+>/g, "")}
                    </p>
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
                        setNewDescription(item.description);
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
          {filteredNews.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              Мэдээ олдсонгүй.
            </p>
          )}
        </div>
      )}

      {/* Add / Edit Presentation Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          {/* Modal */}
          <div className="bg-background w-[90vw] h-[90vh] max-w-screen max-h-screen rounded-2xl shadow-xl p-6 flex flex-col">
            {/* Edit date info */}
            {editId ? (
              <p className="text-sm text-muted-foreground mb-2">
                {editDate
                  ? `Оруулсан: ${new Date(editDate).toLocaleDateString()}`
                  : ""}
              </p>
            ) : null}

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editId ? "Presentation Засах" : "Presentation Нэмэх"}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setEditId(null);
                  setNewTitle("");
                  setNewDescription("");
                  setEditDate("");
                }}
              >
                X
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-4 overflow-auto">
              <Input
                placeholder="Title"
                value={newTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTitle(e.target.value)
                }
              />

              {editId && (
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="p-2 rounded border"
                />
              )}

              <SimpleEditor
                content={newDescription}
                onChange={(value: string) => setNewDescription(value)}
              />
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
