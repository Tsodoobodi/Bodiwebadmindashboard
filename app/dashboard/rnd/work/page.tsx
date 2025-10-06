"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RndpartnerItem {
  id: string;
  title: string;
  contents: Record<string, unknown> | string;
  status: boolean;
  viewers: number;
  position: boolean;
  is_research: boolean;
  created_at: string;
  updated_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function RndpartnerPage() {
  const [rndpartner, setRndpartner] = useState<RndpartnerItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContents, setNewContents] = useState<string>("");
  const [newStatus, setNewStatus] = useState(true);
  const [newPosition, setNewPosition] = useState(false);
  const [newIsResearch, setNewIsResearch] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const jsonToHTML = (json: Record<string, unknown>): string => {
    if (typeof json === "object" && json.content && Array.isArray(json.content)) {
      const htmlNode = json.content.find(
        (node: Record<string, unknown>) => node.type === "html" && node.html
      ) as { html?: string } | undefined;
      if (htmlNode?.html) return htmlNode.html;
    }
    return typeof json === "string" ? json : "";
  };

  const fetchRndpartner = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/rndpartner`);
      const rndpartnerData = res.data.data || res.data;
      const formattedRndpartner = rndpartnerData.map((item: RndpartnerItem) => ({
        ...item,
        contents: typeof item.contents === "object" 
          ? jsonToHTML(item.contents as Record<string, unknown>)
          : item.contents,
      }));
      setRndpartner(formattedRndpartner);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRndpartner();
  }, [fetchRndpartner]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Та устгахдаа итгэлтэй байна уу?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/api/rndpartner/${id}`);
      setRndpartner(rndpartner.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

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

  const handleSave = async () => {
    try {
      if (!newTitle || !newContents) {
        alert("Гарчиг болон контент оруулна уу!");
        return;
      }

      const payload = {
        title: newTitle,
        contents: {
          type: "doc",
          content: [{ type: "html", html: newContents }],
        },
        status: newStatus,
        position: newPosition,
        is_research: newIsResearch,
      };

      if (editId) {
        const res = await axios.put(`${API_URL}/api/rndpartner/${editId}`, payload);
        const updatedItem = res.data.data || res.data;
        setRndpartner(
          rndpartner.map((item) =>
            item.id === editId ? { ...updatedItem, contents: newContents } : item
          )
        );
      } else {
        const res = await axios.post(`${API_URL}/api/rndpartner`, payload);
        const newItem = res.data.data || res.data;
        setRndpartner([{ ...newItem, contents: newContents }, ...rndpartner]);
      }

      setOpen(false);
      setNewTitle("");
      setNewContents("");
      setNewStatus(true);
      setNewPosition(false);
      setNewIsResearch(false);
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Алдаа гарлаа. Console-г шалгана уу.");
    }
  };

  const filteredRndpartner = rndpartner.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-8 items-center mb-4">
        <input
          type="text"
          placeholder="Мэдээ хайх ..."
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
            setNewContents("");
            setNewStatus(true);
            setNewPosition(false);
            setNewIsResearch(false);
          }}
        >
          + Шинэ мэдээ нэмэх 
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Уншиж байна ...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRndpartner.map((item) => {
            const htmlContent = typeof item.contents === "string" ? item.contents : "";
            const images = extractImagesFromHTML(htmlContent);
            const firstImg = images.length > 0 ? images[0] : null;
            const textPreview = extractTextFromHTML(htmlContent);

            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl shadow-md overflow-hidden cursor-pointer flex flex-col transition-all duration-300 ease-in-out hover:scale-100 hover:shadow-xl h-[400px]"
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate flex-1">{item.title}</h3>
                      {item.position && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">⭐</span>
                      )}
                      {item.is_research && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">🔬</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${item.status ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {item.status ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </span>
                      <span className="text-xs text-muted-foreground">👁 {item.viewers}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {textPreview}
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
                        setNewContents(typeof item.contents === "string" ? item.contents : "");
                        setNewStatus(item.status);
                        setNewPosition(item.position);
                        setNewIsResearch(item.is_research);
                      }}
                    >
                      Засах
                    </Button>
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      Устгах
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredRndpartner.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              Мэдээ олдсонгүй.
            </p>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background w-[90vw] h-[90vh] max-w-screen max-h-screen rounded-2xl shadow-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editId ? "Мэдээ засах" : "Мэдээ нэмэх"}
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

            <div className="flex-1 flex flex-col gap-4 overflow-auto">
              <Input
                placeholder="Гарчиг"
                value={newTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTitle(e.target.value)
                }
              />

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={newStatus}
                    onCheckedChange={(checked) => setNewStatus(checked as boolean)}
                  />
                  <Label htmlFor="status">Идэвхтэй</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="position"
                    checked={newPosition}
                    onCheckedChange={(checked) => setNewPosition(checked as boolean)}
                  />
                  <Label htmlFor="position">Онцолсон</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_research"
                    checked={newIsResearch}
                    onCheckedChange={(checked) => setNewIsResearch(checked as boolean)}
                  />
                  <Label htmlFor="is_research">Судалгаа</Label>
                </div>
              </div>

              <SimpleEditor
                key={editId || "new-editor"}
                content={newContents}
                onChange={(html: string) => setNewContents(html)}
              />
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
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