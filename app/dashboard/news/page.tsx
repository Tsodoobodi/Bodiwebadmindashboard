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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Folder } from "lucide-react";

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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bodi-backend-api.azurewebsites.net";

export default function ResearchPage() {
  const [research, setResearch] = useState<NewsItems[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContents, setNewContents] = useState<string>("");
  const [newStatus, setNewStatus] = useState(true);
  const [newPosition, setNewPosition] = useState(false);
  const [newIsResearch, setNewIsResearch] = useState(true);
  const [newCreatedAt, setNewCreatedAt] = useState<string>(""); // ← ШИНЭ
  const [editId, setEditId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<string>("newest");

  const jsonToHTML = (json: Record<string, unknown>): string => {
    if (
      typeof json === "object" &&
      json.content &&
      Array.isArray(json.content)
    ) {
      const htmlNode = json.content.find(
        (node: Record<string, unknown>) => node.type === "html" && node.html
      ) as { html?: string } | undefined;
      if (htmlNode?.html) return htmlNode.html;
    }
    return typeof json === "string" ? json : "";
  };

  const fetchResearch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/news`);
      const researchData = res.data.data || res.data;
      const formattedResearch = researchData.map((item: NewsItems) => ({
        ...item,
        contents:
          typeof item.contents === "object"
            ? jsonToHTML(item.contents as Record<string, unknown>)
            : item.contents,
      }));
      setResearch(formattedResearch);
    } catch (err) {
      console.error("Fetch research error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Та устгахдаа итгэлтэй байна уу?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/api/news/${id}`);
      setResearch(research.filter((item) => item.id !== id));
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

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  };

  const handleSave = async () => {
    try {
      if (!newTitle || !newContents) {
        alert("Гарчиг болон контент оруулна уу!");
        return;
      }

      interface UpdatePayload {
        title: string;
        contents: {
          type: string;
          content: Array<{ type: string; html: string }>;
        };
        status: boolean;
        position: boolean;
        is_research: boolean;
        created_at?: string;
      }

      const payload: UpdatePayload = {
        title: newTitle,
        contents: {
          type: "doc",
          content: [{ type: "html", html: newContents }],
        },
        status: newStatus,
        position: newPosition,
        is_research: newIsResearch,
      };

      // ✅ Огноо өөрчилсөн бол payload-д нэмэх
      if (editId && newCreatedAt) {
        payload.created_at = new Date(newCreatedAt).toISOString();
      }

      if (editId) {
        const res = await axios.put(`${API_URL}/api/news/${editId}`, payload);
        const updatedItem = res.data.data || res.data;
        setResearch(
          research.map((item) =>
            item.id === editId
              ? { ...updatedItem, contents: newContents }
              : item
          )
        );
      } else {
        const res = await axios.post(`${API_URL}/api/news`, payload);
        const newItem = res.data.data || res.data;
        setResearch([{ ...newItem, contents: newContents }, ...research]);
      }

      setOpen(false);
      setNewTitle("");
      setNewContents("");
      setNewStatus(true);
      setNewPosition(false);
      setNewIsResearch(true);
      setNewCreatedAt("");
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Алдаа гарлаа. Console-г шалгана уу.");
    }
  };

  // Filter and sort logic
  const getFilteredAndSortedResearch = () => {
    let filtered = research;

    if (query) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((item) => item.status === true);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((item) => item.status === false);
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (dateSort === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return sorted;
  };

  const filteredResearch = getFilteredAndSortedResearch();

  // Pagination logic
  const totalPages = Math.ceil(filteredResearch.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredResearch.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, dateSort]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center flex-wrap">
          <Input
            type="text"
            placeholder="Мэдээ хайх ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-[400px]"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Төлөв сонгох" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              <SelectItem value="active">Идэвхтэй</SelectItem>
              <SelectItem value="inactive">Идэвхгүй</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateSort} onValueChange={setDateSort}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Эрэмбэлэх" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Шинээс хуучин</SelectItem>
              <SelectItem value="oldest">Хуучнаас шинэ</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="bg-none rounded-xl w-full md:w-[200px] h-10 border border-gray-500 hover:bg-gray-500 hover:text-white transition-all"
            onClick={() => {
              setOpen(true);
              setEditId(null);
              setNewTitle("");
              setNewContents("");
              setNewStatus(true);
              setNewPosition(false);
              setNewIsResearch(true);
              setNewCreatedAt("");
            }}
          >
            + Шинэ мэдээ нэмэх
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Нийт ( {filteredResearch.length} ) мэдээ олдлоо
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-muted-foreground py-12">
          Уншиж байна ...
        </p>
      ) : currentItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Folder />
              </EmptyMedia>
              <EmptyTitle>Мэдээ олдсонгүй.</EmptyTitle>
              <EmptyDescription>
                Та одоогоор ямар ч мэдээ үүсгээгүй байна.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((item) => {
              const htmlContent =
                typeof item.contents === "string" ? item.contents : "";
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
                        <h3 className="font-semibold truncate flex-1">
                          {item.title}
                        </h3>
                        {item.position && (
                          <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                            ⭐
                          </span>
                        )}
                        {item.is_research && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            🔬
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.status
                              ? "bg-green-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {item.status ? "Идэвхтэй" : "Идэвхгүй"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          👁 {item.viewers}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        📅{" "}
                        {new Date(item.created_at).toLocaleDateString("mn-MN")}
                      </p>
                      {item.updated_at && (
                        <p className="text-xs text-muted-foreground/70 mb-2">
                          ✏️{" "}
                          {new Date(item.updated_at).toLocaleDateString(
                            "mn-MN"
                          )}
                        </p>
                      )}
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
                          setNewContents(
                            typeof item.contents === "string"
                              ? item.contents
                              : ""
                          );
                          setNewStatus(item.status);
                          setNewPosition(item.position);
                          setNewIsResearch(item.is_research);
                          setNewCreatedAt(formatDateForInput(item.created_at)); // ← SET DATE
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Өмнөх
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Дараах
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-[95vw] h-[90vh] rounded-2xl shadow-xl p-6 flex flex-col">
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

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={newStatus}
                    onCheckedChange={(checked) =>
                      setNewStatus(checked as boolean)
                    }
                  />
                  <Label htmlFor="status" className="text-sm">
                    Идэвхтэй
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="position"
                    checked={newPosition}
                    onCheckedChange={(checked) =>
                      setNewPosition(checked as boolean)
                    }
                  />
                  <Label htmlFor="position">Онцолсон</Label>
                </div>

                {/* ✅ ОГНОО СОЛИХ */}
                {editId && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date" className="text-sm whitespace-nowrap">
                      📅 Огноо:
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newCreatedAt}
                      onChange={(e) => setNewCreatedAt(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                )}
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
