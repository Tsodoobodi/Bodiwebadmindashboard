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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net";

const ITEMS_PER_PAGE = 9;

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
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchRndresearch = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await axios.get(`${API_URL}/api/research`);
      const data = res.data.data || res.data;
      const formatted = data.map((item: RndresearchItem) => ({
        ...item,
        contents:
          typeof item.contents === "object"
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

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, startDate, endDate]);

  const openDeleteDialog = (item: RndresearchItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/research/${itemToDelete.id}`);
      setRndresearch(rndresearch.filter((item) => item.id !== itemToDelete.id));
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

      if (editId && newCreatedAt) {
        payload.created_at = new Date(newCreatedAt).toISOString();
      }

      if (editId) {
        const res = await axios.put(
          `${API_URL}/api/research/${editId}`,
          payload
        );
        const updatedItem = res.data.data || res.data;
        setRndresearch(
          rndresearch.map((item) =>
            item.id === editId
              ? { ...updatedItem, contents: newContents }
              : item
          )
        );
      } else {
        const res = await axios.post(`${API_URL}/api/research`, payload);
        const newItem = res.data.data || res.data;
        setRndresearch([{ ...newItem, contents: newContents }, ...rndresearch]);
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
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? item.status === true
        : statusFilter === "inactive"
        ? item.status === false
        : true;

    let matchesDate = true;
    if (startDate) {
      matchesDate =
        matchesDate && new Date(item.created_at) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate =
        matchesDate && new Date(item.created_at) <= new Date(endDate);
    }

    return matchesQuery && matchesStatus && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  const handleResetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col gap-6">
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

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
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label>Дуусах:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <Button variant="outline" onClick={handleResetFilters}>
          Шүүлтүүр цэвэрлэх
        </Button>

        <Button
          onClick={openNewModal}
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
            <EmptyDescription>
              Та одоогоор ямар ч судалгаа үүсгээгүй байна.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => {
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
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No image
                    </div>
                  )}

                  <div className="p-3.5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="flex gap-1 shrink-0">
                        {item.position && (
                          <span className="text-[10px] bg-yellow-500/80 px-1.5 py-0.5 rounded text-white">
                            ⭐
                          </span>
                        )}
                        {item.is_research && (
                          <span className="text-[10px] bg-blue-600/80 px-1.5 py-0.5 rounded text-white">
                            🔬
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      {new Date(item.created_at).toLocaleDateString("mn-MN")}
                    </p>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {textPreview}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-2 border-t">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.status
                            ? "bg-green-500/80 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {item.status ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        👁 {item.viewers}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
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

          {/* PAGINATION */}
          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Өмнөх
              </Button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-sm text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(p as number)}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Дараагийн хуудас
              </Button>
            </div>
          )}
        </>
      )}

      {/* MODAL */}
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_research"
                    checked={newIsResearch}
                    onCheckedChange={(checked) => setNewIsResearch(checked as boolean)}
                  />
                  <Label htmlFor="is_research">Судалгаа</Label>
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

      {/* Delete Confirmation Dialog */}
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
                  гэсэн мэдээг бүрмөсөн устгах гэж байна. Энэ үйлдлийг буцаах
                  боломжгүй.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Устгаж байна..." : "Устгах"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}