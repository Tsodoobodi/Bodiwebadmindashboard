"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

interface NewsItems {
  id: string;
  title: string;
  contents: Record<string, unknown> | string;
  status: boolean;
  viewers: number;
  position: boolean;
  is_research: boolean;
  language: string;
  created_at: string;
  updated_at?: string;
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
  language: string;
  created_at?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net";

const ITEMS_PER_PAGE = 9;

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

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
        Эхлэл
      </Button>
      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        Өмнөх
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              className="w-9"
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
      >
        Дараагийн
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        Төгсгөл
      </Button>

      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Хуудас:</span>
        <Input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJump()}
          placeholder={`${currentPage}`}
          className="w-16 h-8 text-xs text-center"
        />
        <span className="text-xs text-muted-foreground">/ {totalPages}</span>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleJump}>
          Очих
        </Button>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [research, setResearch] = useState<NewsItems[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContents, setNewContents] = useState<string>("");
  const [newStatus, setNewStatus] = useState(true);
  const [newPosition, setNewPosition] = useState(false);
  const [newIsResearch, setNewIsResearch] = useState(true);
  const [newLanguage, setNewLanguage] = useState<string>("mn");
  const [newCreatedAt, setNewCreatedAt] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);

  const [saveToRndPartner, setSaveToRndPartner] = useState(false);
  const [saveToResearch, setSaveToResearch] = useState(false);

  // ✅ Бонз дэд ангилалд хадгалах сонголтууд
  const [saveToNature, setSaveToNature] = useState(false);
  const [saveToPerson, setSaveToPerson] = useState(false);
  const [saveToDevelopment, setSaveToDevelopment] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NewsItems | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<string>("newest");
  const [errorMessage, setErrorMessage] = useState<string>("");

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
      setErrorMessage("");
      const res = await axios.get(`${API_URL}/api/news`);

      if (!res.data || (!res.data.data && !Array.isArray(res.data))) {
        throw new Error("Буруу хариу ирлээ");
      }

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
      setErrorMessage("Мэдээ ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  useEffect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          resetModal();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const openDeleteDialog = (item: NewsItems) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/news/${itemToDelete.id}`);
      setResearch(research.filter((item) => item.id !== itemToDelete.id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMessage("Мэдээ устгахад алдаа гарлаа.");
    } finally {
      setDeleting(false);
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

  const formatDateForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  };

  const validateForm = (): boolean => {
    if (!newTitle.trim()) {
      setErrorMessage("Гарчиг оруулна уу!");
      return false;
    }
    if (!newContents.trim()) {
      setErrorMessage("Контент оруулна уу!");
      return false;
    }
    return true;
  };

  // ✅ Сонгосон Бонз дэд ангилал бvрт (nature/person/development) ижил payload-оор save хийнэ
  const saveToBonzCategories = async (payload: UpdatePayload) => {
    const targets: { flag: boolean; endpoint: string; label: string }[] = [
      { flag: saveToNature, endpoint: "nature", label: "Байгаль" },
      { flag: saveToPerson, endpoint: "person", label: "Нийгэм" },
      { flag: saveToDevelopment, endpoint: "development", label: "Засаглал" },
    ];

    for (const target of targets) {
      if (!target.flag) continue;
      try {
        await axios.post(`${API_URL}/api/${target.endpoint}`, payload);
      } catch (error) {
        console.error(`${target.label} save error:`, error);
        setErrorMessage(`Бонз (${target.label}) хэсэгт хадгалахад алдаа гарлаа`);
      }
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setErrorMessage("");

      const payload: UpdatePayload = {
        title: newTitle.trim(),
        contents: {
          type: "doc",
          content: [{ type: "html", html: newContents }],
        },
        status: newStatus,
        position: newPosition,
        is_research: newIsResearch,
        language: newLanguage,
      };

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

        if (saveToRndPartner) {
          try {
            await axios.post(`${API_URL}/api/rndpartner`, payload);
          } catch (error) {
            console.error("RndPartner save error:", error);
            setErrorMessage("Хамтын ажиллагаа хэсэгт хадгалахад алдаа гарлаа");
          }
        }

        if (saveToResearch) {
          try {
            await axios.post(`${API_URL}/api/research`, payload);
          } catch (error) {
            console.error("Research save error:", error);
            setErrorMessage("Судалгаа хэсэгт хадгалахад алдаа гарлаа");
          }
        }

        await saveToBonzCategories(payload);
      } else {
        const res = await axios.post(`${API_URL}/api/news`, payload);
        const newItem = res.data.data || res.data;
        setResearch([{ ...newItem, contents: newContents }, ...research]);

        if (saveToRndPartner) {
          try {
            await axios.post(`${API_URL}/api/rndpartner`, payload);
          } catch (error) {
            console.error("RndPartner save error:", error);
            setErrorMessage("Хамтын ажиллагаа хэсэгт хадгалахад алдаа гарлаа");
          }
        }

        if (saveToResearch) {
          try {
            await axios.post(`${API_URL}/api/research`, payload);
          } catch (error) {
            console.error("Research save error:", error);
            setErrorMessage("Судалгаа хэсэгт хадгалахад алдаа гарлаа");
          }
        }

        await saveToBonzCategories(payload);
      }

      resetModal();
    } catch (err) {
      console.error("Save error:", err);
      setErrorMessage("Мэдээ хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCreatedAt(e.target.value);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "";
  };

  const filteredResearch = useMemo(() => {
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

    if (languageFilter === "mn") {
      filtered = filtered.filter((item) => item.language === "mn");
    } else if (languageFilter === "en") {
      filtered = filtered.filter((item) => item.language === "en");
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [research, query, statusFilter, languageFilter, dateSort]);

  const totalPages = Math.max(1, Math.ceil(filteredResearch.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredResearch.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, languageFilter, dateSort]);

  const resetModal = () => {
    setOpen(false);
    setEditId(null);
    setNewTitle("");
    setNewContents("");
    setNewStatus(true);
    setNewPosition(false);
    setNewIsResearch(true);
    setNewLanguage("mn");
    setNewCreatedAt("");
    setSaveToRndPartner(false);
    setSaveToResearch(false);
    setSaveToNature(false);
    setSaveToPerson(false);
    setSaveToDevelopment(false);
  };

  const openNewModal = () => {
    resetModal();
    setOpen(true);
  };

  const openEditModal = (item: NewsItems) => {
    setOpen(true);
    setEditId(item.id);
    setNewTitle(item.title);
    setNewContents(typeof item.contents === "string" ? item.contents : "");
    setNewStatus(item.status);
    setNewPosition(item.position);
    setNewIsResearch(item.is_research);
    setNewLanguage(item.language || "mn");
    setNewCreatedAt(formatDateForInput(item.created_at));
    // Edit vед bonz сонголтуудыг шинээр эхлvvлнэ (аль хэдийн тэнд байгаа эсэхийг мэдэхгvй тул)
    setSaveToNature(false);
    setSaveToPerson(false);
    setSaveToDevelopment(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center flex-wrap">
          <Input
            type="text"
            placeholder="Мэдээ хайх ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-[300px]"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Төлөв" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              <SelectItem value="active">Идэвхтэй</SelectItem>
              <SelectItem value="inactive">Идэвхгvй</SelectItem>
            </SelectContent>
          </Select>

          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Хэл" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бvх хэл</SelectItem>
              <SelectItem value="mn">Монгол</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateSort} onValueChange={setDateSort}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Эрэмбэлэх" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Шинэ → Хуучин</SelectItem>
              <SelectItem value="oldest">Хуучин → Шинэ</SelectItem>
            </SelectContent>
          </Select>

          <Button className="ml-auto" onClick={openNewModal}>
            + Шинэ мэдээ нэмэх
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Нийт ({filteredResearch.length}) мэдээ олдлоо
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Уншиж байна ...</p>
      ) : currentItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Folder />
              </EmptyMedia>
              <EmptyTitle>Мэдээ олдсонгvй.</EmptyTitle>
              <EmptyDescription>
                Та одоогоор ямар ч мэдээ vvсгээгvй байна.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((item) => {
              const htmlContent =
                typeof item.contents === "string" ? item.contents : "";
              const images = extractImagesFromHTML(htmlContent);
              const firstImg = images.length > 0 ? images[0] : null;
              const textPreview = extractTextFromHTML(htmlContent);

              return (
                <div
                  key={item.id}
                  className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border flex flex-col"
                >
                  {firstImg ? (
                    <Image
                      width={400}
                      height={140}
                      src={firstImg}
                      alt={item.title}
                      className="w-full h-32 object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No image
                    </div>
                  )}

                  <div className="p-3.5 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <h3 className="font-semibold text-sm line-clamp-1 flex-1">
                        {item.title}
                      </h3>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          item.language === "mn"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.language === "mn" ? "MN" : "EN"}
                      </span>
                      {item.position && (
                        <span className="text-[10px] bg-yellow-500/80 px-1.5 py-0.5 rounded text-white shrink-0">
                          ⭐
                        </span>
                      )}
                      {item.is_research && (
                        <span className="text-[10px] bg-blue-600/80 px-1.5 py-0.5 rounded text-white shrink-0">
                          🔬
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.status
                            ? "bg-green-500/80 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {item.status ? "Идэвхтэй" : "Идэвхгvй"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        👁 {item.viewers}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      {new Date(item.created_at).toLocaleDateString("mn-MN")}
                    </p>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {textPreview}
                    </p>

                    <div className="flex gap-2 mt-auto pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(item)}
                        className="flex-1 h-8 text-xs"
                      >
                        Засах
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(item)}
                        className="flex-1 h-8 text-xs"
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

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-[95vw] h-[90vh] rounded-2xl shadow-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editId ? "Мэдээ засах" : "Мэдээ нэмэх"}
              </h2>
              <Button variant="outline" size="sm" onClick={resetModal}>
                X
              </Button>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-auto">
              <Input
                placeholder="Гарчиг"
                value={newTitle}
                onChange={handleTitleChange}
              />

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="language" className="text-sm whitespace-nowrap font-medium">
                    Хэл:
                  </Label>
                  <Select value={newLanguage} onValueChange={setNewLanguage}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Хэл сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mn">Монгол</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={newStatus}
                    onCheckedChange={(checked) => setNewStatus(checked as boolean)}
                  />
                  <Label htmlFor="status" className="text-sm">
                    Идэвхтэй
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="position"
                    checked={newPosition}
                    onCheckedChange={(checked) => setNewPosition(checked as boolean)}
                  />
                  <Label htmlFor="position">Онцолсон</Label>
                </div>

                {editId && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date" className="text-sm whitespace-nowrap">
                      Огноо:
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newCreatedAt}
                      onChange={handleDateChange}
                      className="w-auto"
                    />
                  </div>
                )}
              </div>

              {/* ✅ Хадгалах хэсэг — Хамтын ажиллагаа / Судалгаа */}
              <div className="flex flex-wrap gap-6 pt-1 border-t pt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveToRndPartner"
                    checked={saveToRndPartner}
                    onCheckedChange={(checked) => setSaveToRndPartner(checked as boolean)}
                  />
                  <Label htmlFor="saveToRndPartner" className="text-sm font-medium">
                    Түншлэл Хамтын ажиллагаа
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveToResearch"
                    checked={saveToResearch}
                    onCheckedChange={(checked) => setSaveToResearch(checked as boolean)}
                  />
                  <Label htmlFor="saveToResearch" className="text-sm font-medium">
                    Судалгаа, нийтлэлvvд
                  </Label>
                </div>
              </div>

              {/* ✅ Бонз дэд ангилалд хадгалах сонголтууд */}
              <div className="flex flex-col gap-2 pt-3 border-t">
                <Label className="text-sm font-semibold text-gray-700">
                  Бонз хэсэгт нэмэлтээр хадгалах
                </Label>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveToNature"
                      checked={saveToNature}
                      onCheckedChange={(checked) => setSaveToNature(checked as boolean)}
                    />
                    <Label htmlFor="saveToNature" className="text-sm font-medium">
                      Байгаль
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveToPerson"
                      checked={saveToPerson}
                      onCheckedChange={(checked) => setSaveToPerson(checked as boolean)}
                    />
                    <Label htmlFor="saveToPerson" className="text-sm font-medium">
                      Нийгэм
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveToDevelopment"
                      checked={saveToDevelopment}
                      onCheckedChange={(checked) => setSaveToDevelopment(checked as boolean)}
                    />
                    <Label htmlFor="saveToDevelopment" className="text-sm font-medium">
                      Засаглал
                    </Label>
                  </div>
                </div>
              </div>

              <SimpleEditor
                key={editId || "new-editor"}
                content={newContents}
                onChange={(html: string) => setNewContents(html)}
              />
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={resetModal} disabled={saving}>
                Болих
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Хадгалж байна..." : editId ? "Шинэчлэх" : "Нэмэх"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Та устгахдаа итгэлтэй байна уу?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete && (
                <>
                  <span className="font-medium text-foreground">
                    {itemToDelete.title}
                  </span>{" "}
                  гэсэн мэдээг бvрмөсөн устгах гэж байна. Энэ vйлдлийг буцаах
                  боломжгvй.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
            >
              {deleting ? "Устгаж байна..." : "Устгах"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}