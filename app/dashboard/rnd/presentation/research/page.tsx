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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Folder } from "lucide-react";

interface RndresearchItem {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bodi-backend-api.azurewebsites.net";

export default function RndresearchPage() {
  const [rndresearch, setRndresearch] = useState<RndresearchItem[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContents, setNewContents] = useState<string>("");
  const [newStatus, setNewStatus] = useState(true);
  const [newPosition, setNewPosition] = useState(false);
  const [newIsResearch, setNewIsResearch] = useState(true);
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

  const fetchRndresearch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/rndresearch`);
      const data = res.data.data || res.data;
      const formatted = data.map((item: RndresearchItem) => ({
        ...item,
        contents: typeof item.contents === "object"
          ? jsonToHTML(item.contents as Record<string, unknown>)
          : item.contents,
      }));
      setRndresearch(formatted);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRndresearch();
  }, [fetchRndresearch]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Та устгахдаа итгэлтэй байна уу?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/api/rndresearch/${id}`);
      setRndresearch(rndresearch.filter((item) => item.id !== id));
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
        const res = await axios.put(`${API_URL}/api/rndresearch/${editId}`, payload);
        const updatedItem = res.data.data || res.data;
        setRndresearch(
          rndresearch.map((item) =>
            item.id === editId ? { ...updatedItem, contents: newContents } : item
          )
        );
      } else {
        const res = await axios.post(`${API_URL}/api/rndresearch`, payload);
        const newItem = res.data.data || res.data;
        setRndresearch([{ ...newItem, contents: newContents }, ...rndresearch]);
      }

      setOpen(false);
      setNewTitle("");
      setNewContents("");
      setNewStatus(true);
      setNewPosition(false);
      setNewIsResearch(true);
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Алдаа гарлаа. Console-г шалгана уу.");
    }
  };

  const filtered = rndresearch.filter((item) => {
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

  const handleResetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* FILTERS */}
      <div className="bg-card/60 backdrop-blur-md rounded-2xl shadow-sm border p-4 flex flex-wrap items-center gap-4 sticky top-0 z-10">
        <Input
          type="text"
          placeholder="Гарчгаар хайх..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-[300px]"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            <SelectItem value="active">Идэвхтэй</SelectItem>
            <SelectItem value="inactive">Идэвхгүй</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Label>Эхлэх:</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
        </div>

        <div className="flex items-center gap-2">
          <Label>Дуусах:</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
        </div>

        <Button variant="outline" onClick={handleResetFilters}>
          Шүүлтүүр цэвэрлэх
        </Button>

        <Button
          onClick={() => {
            setOpen(true);
            setEditId(null);
            setNewTitle("");
            setNewContents("");
            setNewStatus(true);
            setNewPosition(false);
            setNewIsResearch(true);
          }}
          className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:shadow-lg transition-all duration-300"
        >
          + Шинэ мэдээ нэмэх
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} / {rndresearch.length} мэдээ
        </span>
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        <p className="text-center text-muted-foreground py-10">Уншиж байна...</p>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Folder />
            </EmptyMedia>
            <EmptyTitle>Мэдээ олдсонгүй</EmptyTitle>
            <EmptyDescription>Та одоогоор ямар ч судалгаа үүсгээгүй байна.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const htmlContent = typeof item.contents === "string" ? item.contents : "";
            const images = extractImagesFromHTML(htmlContent);
            const firstImg = images.length > 0 ? images[0] : null;
            const textPreview = extractTextFromHTML(htmlContent);

            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border flex flex-col"
              >
                {firstImg ? (
                  <Image
                    width={400}
                    height={200}
                    src={firstImg}
                    alt={item.title}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    No image
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base line-clamp-1">{item.title}</h3>
                    <div className="flex gap-1">
                      {item.position && <span className="text-xs bg-yellow-500/80 px-2 py-0.5 rounded text-white">⭐</span>}
                      {item.is_research && <span className="text-xs bg-blue-600/80 px-2 py-0.5 rounded text-white">🔬</span>}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">{new Date(item.created_at).toLocaleDateString()}</p>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{textPreview}</p>

                  <div className="flex justify-between items-center mt-auto pt-2 border-t">
                    <span className={`text-xs px-2 py-1 rounded-full ${item.status ? "bg-green-500/80 text-white" : "bg-gray-400 text-white"}`}>
                      {item.status ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                    <span className="text-xs text-muted-foreground">👁 {item.viewers}</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
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
                      className="flex-1"
                    >
                      Засах
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                      className="flex-1"
                    >
                      Устгах
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background w-[90vw] h-[90vh] rounded-2xl shadow-2xl border p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold">{editId ? "Судалгаа засах" : "Шинэ судалгаа нэмэх"}</h2>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>X</Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <Input placeholder="Гарчиг" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="status" checked={newStatus} onCheckedChange={(checked) => setNewStatus(checked as boolean)} />
                  <Label htmlFor="status">Идэвхтэй</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="position" checked={newPosition} onCheckedChange={(checked) => setNewPosition(checked as boolean)} />
                  <Label htmlFor="position">Онцолсон</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="is_research" checked={newIsResearch} onCheckedChange={(checked) => setNewIsResearch(checked as boolean)} />
                  <Label htmlFor="is_research">Судалгаа</Label>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <SimpleEditor key={editId || "new-editor"} content={newContents} onChange={(html: string) => setNewContents(html)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 border-t pt-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Болих</Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:shadow-lg transition-all">
                {editId ? "Шинэчлэх" : "Нэмэх"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
