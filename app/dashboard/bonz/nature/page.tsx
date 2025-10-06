"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

interface NatureItem {
  id: string;
  title: string;
  contents: Record<string, unknown> | string;
  created_at: string;
  updated_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function NaturePage() {
  const [nature, setNature] = useState<NatureItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContents, setNewContents] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);

  const jsonToHTML = (json: Record<string, unknown>): string => {
    if (
      typeof json === "object" &&
      json.content &&
      Array.isArray(json.content)
    ) {
      const htmlNode = json.content.find(
        (node: Record<string, unknown>) => node.type === "html" && node.html
      ) as { html?: string } | undefined;

      if (htmlNode?.html) {
        return htmlNode.html;
      }
    }

    return typeof json === "string" ? json : "";
  };

  const fetchNature = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/nature`);
      const natureData = res.data.data || res.data;

      const formattedNature = natureData.map((item: NatureItem) => ({
        ...item,
        contents:
          typeof item.contents === "object"
            ? jsonToHTML(item.contents as Record<string, unknown>)
            : item.contents,
      }));

      setNature(formattedNature);
    } catch (err) {
      console.error("Fetch nature error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNature();
  }, [fetchNature]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Та устгахдаа итгэлтэй байна уу?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/api/nature/${id}`);
      setNature(nature.filter((item) => item.id !== id));
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
          content: [
            {
              type: "html",
              html: newContents,
            },
          ],
        },
      };

      if (editId) {
        const res = await axios.put(
          `${API_URL}/api/nature/${editId}`,
          payload
        );
        const updatedItem = res.data.data || res.data;
        setNature(
          nature.map((item) =>
            item.id === editId
              ? { ...updatedItem, contents: newContents }
              : item
          )
        );
      } else {
        const res = await axios.post(`${API_URL}/api/nature`, payload);
        const newItem = res.data.data || res.data;
        setNature([{ ...newItem, contents: newContents }, ...nature]);
      }

      setOpen(false);
      setNewTitle("");
      setNewContents("");
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Алдаа гарлаа. Console-г шалгана уу.");
    }
  };

  const filteredNature = nature.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-8 items-center mb-4">
        <input
          type="text"
          placeholder=" Мэдээ хайх ..."
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
          }}
        >
          + Шинэ мэдээ нэмэх
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Уншиж байна ...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNature.map((item) => {
            const htmlContent =
              typeof item.contents === "string" ? item.contents : "";
            const images = extractImagesFromHTML(htmlContent);
            const firstImg = images.length > 0 ? images[0] : null;
            const textPreview = extractTextFromHTML(htmlContent);

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

                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
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
                          typeof item.contents === "string" ? item.contents : ""
                        );
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
          {filteredNature.length === 0 && (
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
                  setNewTitle("");
                  setNewContents("");
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

              <SimpleEditor
                key={editId || "new-editor"}
                content={newContents}
                onChange={(html: string) => setNewContents(html)}
              />
            </div>

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