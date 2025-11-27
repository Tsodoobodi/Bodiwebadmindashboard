"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  const [newCreatedAt, setNewCreatedAt] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NewsItems | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

      // Validate response
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
        const res = await axios.put(`${API_URL}/api/news/${editId}`, payload);
        const updatedItem = res.data.data || res.data;
        setResearch(
          research.map((item) =>
            item.id === editId
              ? { ...updatedItem, contents: newContents }
              : item
          )
        );
        console.log("Мэдээ амжилттай шинэчлэгдлээ");
      } else {
        const res = await axios.post(`${API_URL}/api/news`, payload);
        const newItem = res.data.data || res.data;
        setResearch([{ ...newItem, contents: newContents }, ...research]);
        console.log("Шинэ мэдээ амжилттай нэмэгдлээ");
      }

      // Reset form
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

  // Filter and sort with useMemo for performance
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
  }, [research, query, statusFilter, dateSort]);

  // Pagination logic
  const totalPages = Math.ceil(filteredResearch.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredResearch.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, dateSort]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const openEditModal = (item: NewsItems) => {
    setOpen(true);
    setEditId(item.id);
    setNewTitle(item.title);
    setNewContents(typeof item.contents === "string" ? item.contents : "");
    setNewStatus(item.status);
    setNewPosition(item.position);
    setNewIsResearch(item.is_research);
    setNewCreatedAt(formatDateForInput(item.created_at));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Error Message Banner */}
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

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
            onClick={openNewModal}
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
                      onError={handleImageError}
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
                        onClick={() => openEditModal(item)}
                      >
                        Засах
                      </Button>
                      <Button
                        className="cursor-pointer"
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(item)}
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

                {editId && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date" className="text-sm whitespace-nowrap">
                      📅 Огноо:
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
