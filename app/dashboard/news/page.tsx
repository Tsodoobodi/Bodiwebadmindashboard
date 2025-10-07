"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import React from "react";
import axios, { AxiosError } from "axios"; // ⬅️ AxiosError нэмсэн
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";

interface NewsItems {
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

export default function NewsPage() {
  const router = useRouter();
  const [rndpartner, setRndpartner] = useState<NewsItems[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [updatedDateFilter, setUpdatedDateFilter] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContents, setNewContents] = useState<string>("");
  const [newStatus, setNewStatus] = useState(true);
  const [newPosition, setNewPosition] = useState(false);
  const [newIsResearch, setNewIsResearch] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [updatedDate, setUpdatedDate] = useState<Date | undefined>(undefined);

  // ✅ Token авах helper function
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Нэвтрэх шаардлагатай!");
      router.push("/login");
      throw new Error("No token");
    }
    return {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    };
  };

  // ✅ 401 error handler - AxiosError type ашигласан
  const handleAuthError = (error: AxiosError | Error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      alert("Token хүчингүй байна. Дахин нэвтэрнэ үү!");
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

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
      const res = await axios.get(`${API_URL}/api/news`, getAuthHeaders());
      const rndpartnerData = res.data.data || res.data;
      const formattedRndpartner = rndpartnerData.map((item: NewsItems) => ({
        ...item,
        contents:
          typeof item.contents === "object"
            ? jsonToHTML(item.contents as Record<string, unknown>)
            : item.contents,
      }));
      setRndpartner(formattedRndpartner);
    } catch (err) {
      console.error("Fetch news error:", err);
      handleAuthError(err as AxiosError);
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
      await axios.delete(`${API_URL}/api/news/${id}`, getAuthHeaders());
      setRndpartner(rndpartner.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      handleAuthError(err as AxiosError);
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

      interface Payload {
        title: string;
        contents: { type: "doc"; content: { type: "html"; html: string }[] };
        status: boolean;
        position: boolean;
        is_research: boolean;
        updated_at?: string;
      }

      const payload: Payload = {
        title: newTitle,
        contents: {
          type: "doc",
          content: [{ type: "html", html: newContents }],
        },
        status: newStatus,
        position: newPosition,
        is_research: newIsResearch,
        updated_at: updatedDate?.toISOString(),
      };

      if (editId) {
        const res = await axios.put(`${API_URL}/api/news/${editId}`, payload, getAuthHeaders());
        const updatedItem = res.data.data || res.data;
        setRndpartner(
          rndpartner.map((item) =>
            item.id === editId ? { ...updatedItem, contents: newContents } : item
          )
        );
      } else {
        const res = await axios.post(`${API_URL}/api/news`, payload, getAuthHeaders());
        const newItem = res.data.data || res.data;
        setRndpartner([{ ...newItem, contents: newContents }, ...rndpartner]);
      }

      setOpen(false);
      setNewTitle("");
      setNewContents("");
      setNewStatus(true);
      setNewPosition(false);
      setNewIsResearch(false);
      setUpdatedDate(undefined);
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
      handleAuthError(err as AxiosError);
      alert("Алдаа гарлаа. Console-г шалгана уу.");
    }
  };

  const filteredRndpartner = rndpartner.filter((item) => {
    const matchesTitle = item.title.toLowerCase().includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? item.status === true
        : item.status === false;
    const matchesDate = updatedDateFilter
      ? new Date(item.updated_at ?? item.created_at).toDateString() === updatedDateFilter.toDateString()
      : true;
    return matchesTitle && matchesStatus && matchesDate;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search + Filter + Date + Add */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <Input
          type="text"
          placeholder="Мэдээ хайх ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] border-gray-300 focus:border-blue-400 focus:ring-blue-200 rounded-lg shadow-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="px-4 py-2 rounded-lg border bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="all">Бүгд</option>
          <option value="active">Идэвхтэй</option>
          <option value="inactive">Идэвхгүй</option>
        </select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[250px] justify-between">
              {updatedDateFilter ? updatedDateFilter.toLocaleDateString() : "Огноогоор шүүх"}
              <Calendar className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <ShadcnCalendar
              mode="single"
              selected={updatedDateFilter}
              onSelect={(date) => setUpdatedDateFilter(date ?? undefined)}
            />
          </PopoverContent>
        </Popover>

        <Button
          className="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl h-10 px-6 shadow-lg hover:scale-105 transition-transform duration-200"
          onClick={() => {
            setOpen(true);
            setEditId(null);
            setNewTitle("");
            setNewContents("");
            setNewStatus(true);
            setNewPosition(false);
            setNewIsResearch(false);
            setUpdatedDate(new Date());
          }}
        >
          + Шинэ мэдээ
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-center text-gray-400">Уншиж байна ...</p>
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
                className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-[400px]"
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
                        <span className="text-xs bg-yellow-400 text-white px-2 py-1 rounded">⭐</span>
                      )}
                      {item.is_research && (
                        <span className="text-xs bg-blue-400 text-white px-2 py-1 rounded">🔬</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.status ? "bg-green-400 text-white" : "bg-gray-400 text-white"
                        }`}
                      >
                        {item.status ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                      <span className="text-xs text-gray-500">👁 {item.viewers}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Үүсгэсэн: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.updated_at && (
                      <p className="text-xs text-blue-400 mb-2">
                        Шинэчилсэн: {new Date(item.updated_at).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-3">{textPreview}</p>
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
                        setUpdatedDate(item.updated_at ? new Date(item.updated_at) : new Date());
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
            <p className="col-span-full text-center text-gray-400">Мэдээ олдсонгүй.</p>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[90vw] h-[90vh] max-w-screen max-h-screen rounded-3xl shadow-2xl p-6 flex flex-col transition-transform duration-300 scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editId ? "RnDPartner Засах" : "RnDPartner Нэмэх"}
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
                onChange={(e) => setNewTitle(e.target.value)}
                className="border-gray-300 rounded-lg shadow-sm"
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
                  <Label htmlFor="is_research">Судалгаа руу нэмэх</Label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Шинэчилсэн огноо сонгох:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[250px] justify-between">
                      {updatedDate ? updatedDate.toLocaleDateString() : "Огноо сонгох"}
                      <Calendar className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadcnCalendar
                      mode="single"
                      selected={updatedDate}
                      onSelect={(date) => setUpdatedDate(date ?? new Date())}
                    />
                  </PopoverContent>
                </Popover>
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
              <Button onClick={handleSave}>{editId ? "Шинэчлэх" : "Нэмэх"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}