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

// ---- Shared glass style tokens (kept consistent with Dashboard / Sidebar / Header) ----
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

// ---- Light tokens, used only inside the news editor modal ----
// Typing/reading form content over a translucent glass panel was hard to read,
// so the modal itself stays a plain white surface while the rest of the page stays glassy.
const LIGHT_INPUT = "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400";
const LIGHT_TRIGGER = "bg-white border-gray-200 text-gray-800";
const LIGHT_CONTENT = "bg-white border-gray-200 text-gray-800";
const LIGHT_ITEM = "text-gray-700 focus:bg-gray-100 focus:text-gray-900";
const LIGHT_OUTLINE_BTN = "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900";
const LIGHT_CHECKBOX = "border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600";

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
          onKeyDown={(e) => e.key === "Enter" && handleJump()}
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
        <div className="bg-red-400/10 border border-red-400/30 backdrop-blur-xl text-red-200 px-4 py-3 rounded-2xl">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className={`flex gap-4 items-center flex-wrap p-4 ${GLASS_PANEL}`}>
          <Input
            type="text"
            placeholder="Мэдээ хайх ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full md:w-[300px] ${GLASS_INPUT}`}
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-full md:w-[140px] ${GLASS_TRIGGER}`}>
              <SelectValue placeholder="Төлөв" />
            </SelectTrigger>
            <SelectContent className={GLASS_CONTENT}>
              <SelectItem value="all" className={GLASS_ITEM}>Бүгд</SelectItem>
              <SelectItem value="active" className={GLASS_ITEM}>Идэвхтэй</SelectItem>
              <SelectItem value="inactive" className={GLASS_ITEM}>Идэвхгvй</SelectItem>
            </SelectContent>
          </Select>

          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className={`w-full md:w-[140px] ${GLASS_TRIGGER}`}>
              <SelectValue placeholder="Хэл" />
            </SelectTrigger>
            <SelectContent className={GLASS_CONTENT}>
              <SelectItem value="all" className={GLASS_ITEM}>Бvх хэл</SelectItem>
              <SelectItem value="mn" className={GLASS_ITEM}>Монгол</SelectItem>
              <SelectItem value="en" className={GLASS_ITEM}>English</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateSort} onValueChange={setDateSort}>
            <SelectTrigger className={`w-full md:w-40 ${GLASS_TRIGGER}`}>
              <SelectValue placeholder="Эрэмбэлэх" />
            </SelectTrigger>
            <SelectContent className={GLASS_CONTENT}>
              <SelectItem value="newest" className={GLASS_ITEM}>Шинэ → Хуучин</SelectItem>
              <SelectItem value="oldest" className={GLASS_ITEM}>Хуучин → Шинэ</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="ml-auto bg-blue-500/90 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] cursor-pointer"
            onClick={openNewModal}
          >
            + Шинэ мэдээ нэмэх
          </Button>
        </div>

        <p className="text-sm text-white/45">
          Нийт ({filteredResearch.length}) мэдээ олдлоо
        </p>
      </div>

      {loading ? (
        <p className="text-center text-white/45 py-12">Уншиж байна ...</p>
      ) : currentItems.length === 0 ? (
        <div className={`text-center py-12 ${GLASS_PANEL}`}>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white/10 text-white/60">
                <Folder />
              </EmptyMedia>
              <EmptyTitle className="text-white">Мэдээ олдсонгvй.</EmptyTitle>
              <EmptyDescription className="text-white/45">
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
                  className={`overflow-hidden transition-all duration-200 flex flex-col hover:-translate-y-1 hover:bg-white/[0.08] ${GLASS_PANEL}`}
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
                    <div className="w-full h-32 bg-white/[0.03] flex items-center justify-center text-white/30 text-xs">
                      No image
                    </div>
                  )}

                  <div className="p-3.5 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <h3 className="font-semibold text-sm line-clamp-1 flex-1 text-white">
                        {item.title}
                      </h3>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          item.language === "mn"
                            ? "bg-blue-400/20 text-blue-200"
                            : "bg-emerald-400/20 text-emerald-200"
                        }`}
                      >
                        {item.language === "mn" ? "MN" : "EN"}
                      </span>
                      {item.position && (
                        <span className="text-[10px] bg-amber-400/80 px-1.5 py-0.5 rounded text-white shrink-0">
                          ⭐
                        </span>
                      )}
                      {item.is_research && (
                        <span className="text-[10px] bg-blue-500/80 px-1.5 py-0.5 rounded text-white shrink-0">
                          🔬
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.status
                            ? "bg-emerald-500/80 text-white"
                            : "bg-white/15 text-white/70"
                        }`}
                      >
                        {item.status ? "Идэвхтэй" : "Идэвхгvй"}
                      </span>
                      <span className="text-[10px] text-white/40">
                        👁 {item.viewers}
                      </span>
                    </div>

                    <p className="text-[11px] text-white/40 mb-1.5">
                      {new Date(item.created_at).toLocaleDateString("mn-MN")}
                    </p>

                    <p className="text-xs text-white/50 line-clamp-2 mb-2">
                      {textPreview}
                    </p>

                    <div className="flex gap-2 mt-auto pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(item)}
                        className={`flex-1 h-8 text-xs cursor-pointer ${GLASS_OUTLINE_BTN}`}
                      >
                        Засах
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(item)}
                        className="flex-1 h-8 text-xs bg-red-500/80 hover:bg-red-500 text-white cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-[95vw] h-[90vh] rounded-2xl shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editId ? "Мэдээ засах" : "Мэдээ нэмэх"}
              </h2>
              <Button variant="outline" size="sm" onClick={resetModal} className={LIGHT_OUTLINE_BTN}>
                X
              </Button>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-auto">
              <Input
                placeholder="Гарчиг"
                value={newTitle}
                onChange={handleTitleChange}
                className={LIGHT_INPUT}
              />

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="language" className="text-sm whitespace-nowrap font-medium text-gray-700">
                    Хэл:
                  </Label>
                  <Select value={newLanguage} onValueChange={setNewLanguage}>
                    <SelectTrigger className={`w-[150px] ${LIGHT_TRIGGER}`}>
                      <SelectValue placeholder="Хэл сонгох" />
                    </SelectTrigger>
                    <SelectContent className={LIGHT_CONTENT}>
                      <SelectItem value="mn" className={LIGHT_ITEM}>Монгол</SelectItem>
                      <SelectItem value="en" className={LIGHT_ITEM}>English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={newStatus}
                    onCheckedChange={(checked) => setNewStatus(checked as boolean)}
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="status" className="text-sm text-gray-700">
                    Идэвхтэй
                  </Label>
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

                {editId && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date" className="text-sm whitespace-nowrap text-gray-700">
                      Огноо:
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newCreatedAt}
                      onChange={handleDateChange}
                      className={`w-auto ${LIGHT_INPUT}`}
                    />
                  </div>
                )}
              </div>

              {/* ✅ Хадгалах хэсэг — Хамтын ажиллагаа / Судалгаа */}
              <div className="flex flex-wrap gap-6 pt-1 border-t border-gray-100 pt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveToRndPartner"
                    checked={saveToRndPartner}
                    onCheckedChange={(checked) => setSaveToRndPartner(checked as boolean)}
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="saveToRndPartner" className="text-sm font-medium text-gray-700">
                    Түншлэл Хамтын ажиллагаа
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveToResearch"
                    checked={saveToResearch}
                    onCheckedChange={(checked) => setSaveToResearch(checked as boolean)}
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="saveToResearch" className="text-sm font-medium text-gray-700">
                    Судалгаа, нийтлэлvvд
                  </Label>
                </div>
              </div>

              {/* ✅ Бонз дэд ангилалд хадгалах сонголтууд */}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                <Label className="text-sm font-semibold text-gray-700">
                  Бонз хэсэгт нэмэлтээр хадгалах
                </Label>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveToNature"
                      checked={saveToNature}
                      onCheckedChange={(checked) => setSaveToNature(checked as boolean)}
                      className={LIGHT_CHECKBOX}
                    />
                    <Label htmlFor="saveToNature" className="text-sm font-medium text-gray-700">
                      Байгаль
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveToPerson"
                      checked={saveToPerson}
                      onCheckedChange={(checked) => setSaveToPerson(checked as boolean)}
                      className={LIGHT_CHECKBOX}
                    />
                    <Label htmlFor="saveToPerson" className="text-sm font-medium text-gray-700">
                      Нийгэм
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveToDevelopment"
                      checked={saveToDevelopment}
                      onCheckedChange={(checked) => setSaveToDevelopment(checked as boolean)}
                      className={LIGHT_CHECKBOX}
                    />
                    <Label htmlFor="saveToDevelopment" className="text-sm font-medium text-gray-700">
                      Засаглал
                    </Label>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <SimpleEditor
                  key={editId || "new-editor"}
                  content={newContents}
                  onChange={(html: string) => setNewContents(html)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={resetModal} disabled={saving} className={LIGHT_OUTLINE_BTN}>
                Болих
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? "Хадгалж байна..." : editId ? "Шинэчлэх" : "Нэмэх"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black/70 backdrop-blur-2xl border border-white/15 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Та устгахдаа итгэлтэй байна уу?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              {itemToDelete && (
                <>
                  <span className="font-medium text-white">
                    {itemToDelete.title}
                  </span>{" "}
                  гэсэн мэдээг бvрмөсөн устгах гэж байна. Энэ vйлдлийг буцаах
                  боломжгvй.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className={GLASS_OUTLINE_BTN}>
              Болих
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-500/90 text-white hover:bg-red-500"
            >
              {deleting ? "Устгаж байна..." : "Устгах"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}