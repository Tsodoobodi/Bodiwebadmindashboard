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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net";

// ---- Shared glass tokens (matching Dashboard / Sidebar / Header / News / VideoNews / RnD pages) ----
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

// ---- Light tokens, used only inside the editor modal (typing over glass is hard to read) ----
const LIGHT_INPUT = "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400";
const LIGHT_OUTLINE_BTN = "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900";
const LIGHT_CHECKBOX = "border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600";

export default function RndresearchPage() {
  const [rndresearch, setRndresearch] = useState<RndresearchItem[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContents, setNewContents] = useState<string>("");
  const [newStatus, setNewStatus] = useState(true);
  const [newPosition, setNewPosition] = useState(false);
  const [newIsResearch, setNewIsResearch] = useState(true);
  const [newCreatedAt, setNewCreatedAt] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RndresearchItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

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
      setErrorMessage("");
      const res = await axios.get(`${API_URL}/api/rndexchange`);
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
      setErrorMessage("Мэдээ ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRndresearch();
  }, [fetchRndresearch]);

  // Modal escape key handler
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

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const openDeleteDialog = (item: RndresearchItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/rndexchange/${itemToDelete.id}`);
      setRndresearch(rndresearch.filter((item) => item.id !== itemToDelete.id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      console.log("Мэдээ амжилттай устгагдлаа");
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
      };

      // Огноо өөрчилсөн бол payload-д нэмэх
      if (editId && newCreatedAt) {
        payload.created_at = new Date(newCreatedAt).toISOString();
      }

      if (editId) {
        const res = await axios.put(`${API_URL}/api/rndexchange/${editId}`, payload);
        const updatedItem = res.data.data || res.data;
        setRndresearch(
          rndresearch.map((item) =>
            item.id === editId
              ? { ...updatedItem, contents: newContents }
              : item
          )
        );
        console.log("Мэдээ амжилттай шинэчлэгдлээ");
      } else {
        const res = await axios.post(`${API_URL}/api/rndexchange`, payload);
        const newItem = res.data.data || res.data;
        setRndresearch([{ ...newItem, contents: newContents }, ...rndresearch]);
        console.log("Шинэ мэдээ амжилттай нэмэгдлээ");
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

  const resetModal = () => {
    setOpen(false);
    setEditId(null);
    setNewTitle("");
    setNewContents("");
    setNewStatus(true);
    setNewPosition(false);
    setNewIsResearch(true);
    setNewCreatedAt("");
  };

  const openNewModal = () => {
    resetModal();
    setOpen(true);
  };

  const openEditModal = (item: RndresearchItem) => {
    setOpen(true);
    setEditId(item.id);
    setNewTitle(item.title);
    setNewContents(typeof item.contents === "string" ? item.contents : "");
    setNewStatus(item.status);
    setNewPosition(item.position);
    setNewIsResearch(item.is_research);
    setNewCreatedAt(formatDateForInput(item.created_at));
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
      {/* Error Message Banner */}
      {errorMessage && (
        <div className="bg-red-400/10 border border-red-400/30 backdrop-blur-xl text-red-200 px-4 py-3 rounded-2xl">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* FILTERS */}
      <div className={`flex flex-wrap items-center gap-4 sticky top-0 z-10 p-4 ${GLASS_PANEL}`}>
        <Input
          type="text"
          placeholder="Гарчгаар хайх..."
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
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-[160px] ${GLASS_INPUT}`} />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-white/70">Дуусах:</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`w-[160px] ${GLASS_INPUT}`} />
        </div>

        <Button variant="outline" onClick={handleResetFilters} className={GLASS_OUTLINE_BTN}>
          Шүүлтүүр цэвэрлэх
        </Button>

        <Button
          onClick={openNewModal}
          className="ml-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-[0_0_24px_rgba(99,102,241,0.45)] transition-all duration-300"
        >
          + Шинэ мэдээ нэмэх
        </Button>

        <span className="text-sm text-white/45 ml-auto">
          {filtered.length} / {rndresearch.length} мэдээ
        </span>
      </div>

      {/* CONTENT GRID */}
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
              <EmptyDescription className="text-white/45">Та одоогоор ямар ч судалгаа үүсгээгүй байна.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
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
                className={`overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1 hover:bg-white/[0.08] ${GLASS_PANEL}`}
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
                  <div className="w-full h-44 bg-white/[0.03] flex items-center justify-center text-white/30 text-sm">
                    No image
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base line-clamp-1 text-white">{item.title}</h3>
                    <div className="flex gap-1">
                      {item.position && <span className="text-xs bg-amber-400/80 px-2 py-0.5 rounded text-white">⭐</span>}
                      {item.is_research && <span className="text-xs bg-blue-500/80 px-2 py-0.5 rounded text-white">🔬</span>}
                    </div>
                  </div>

                  <p className="text-xs text-white/45 mb-2">
                    📅 {new Date(item.created_at).toLocaleDateString("mn-MN")}
                  </p>
                  {item.updated_at && (
                    <p className="text-xs text-white/30 mb-2">
                      ✏️ {new Date(item.updated_at).toLocaleDateString("mn-MN")}
                    </p>
                  )}

                  <p className="text-sm text-white/50 line-clamp-3 mb-3">{textPreview}</p>

                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/10">
                    <span className={`text-xs px-2 py-1 rounded-full ${item.status ? "bg-emerald-500/80 text-white" : "bg-white/15 text-white/70"}`}>
                      {item.status ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                    <span className="text-xs text-white/40">👁 {item.viewers}</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(item)}
                      className={`flex-1 ${GLASS_OUTLINE_BTN}`}
                    >
                      Засах
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(item)}
                      className="flex-1 bg-red-500/80 hover:bg-red-500 text-white"
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

      {/* MODAL — plain white surface, same as the other editors, since typing over glass is hard to read */}
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={newStatus}
                    onCheckedChange={(checked) =>
                      setNewStatus(checked as boolean)
                    }
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
                    onCheckedChange={(checked) =>
                      setNewPosition(checked as boolean)
                    }
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="position" className="text-gray-700">Онцолсон</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_research"
                    checked={newIsResearch}
                    onCheckedChange={(checked) =>
                      setNewIsResearch(checked as boolean)
                    }
                    className={LIGHT_CHECKBOX}
                  />
                  <Label htmlFor="is_research" className="text-gray-700">Судалгаа</Label>
                </div>

                {editId && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date" className="text-sm whitespace-nowrap text-gray-700">
                      📅 Огноо:
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

      {/* Delete Confirmation Dialog */}
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
                  гэсэн мэдээг бүрмөсөн устгах гэж байна. Энэ үйлдлийг буцаах
                  боломжгүй.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className={GLASS_OUTLINE_BTN}>Болих</AlertDialogCancel>
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