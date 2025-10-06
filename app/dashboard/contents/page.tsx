"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ContentItem {
  id: string;
  title: string;
  url: string; // youtube url
  description?: string;
  created_date: string;
  updated_date?: string;
}

export default function Contents() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(6);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [createdDate, setCreatedDate] = useState("");

  // Fetch contents
  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/content");
      if (Array.isArray(res.data)) setContents(res.data);
      else setContents([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Pagination
  const filtered = Array.isArray(contents)
    ? contents.filter(
        (c) =>
          typeof c.title === "string" &&
          typeof search === "string" &&
          c.title.toLowerCase().includes(search.toLowerCase())
      )
    : [];
  const lastIndex = currentPage * perPage;
  const firstIndex = lastIndex - perPage;
  const currentItems = filtered.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Handlers
  const handleSave = async () => {
    try {
      if (!title || !url) return;

      if (editId) {
        // Edit
        const updatePayload: Partial<ContentItem> = {
          title,
          url,
          description,
        };
        // Хэрвээ createdDate input-оор утга орж ирсэн бол updated_date-д илгээнэ
        if (createdDate) {
          updatePayload.updated_date = new Date(createdDate).toISOString();
        }
        await axios.put(
          `http://localhost:5001/api/content/${editId}`,
          updatePayload
        );

        // card state-г шууд update хийх
        setContents((prev) =>
          prev.map((c) =>
            c.id === editId
              ? {
                  ...c,
                  title: title,
                  url: url,
                  description: description,
                  updated_date: createdDate
                    ? new Date(createdDate).toISOString()
                    : c.updated_date,
                }
              : c
          )
        );
      } else {
        // Create
        const res = await axios.post("http://localhost:5001/api/content", {
          title,
          url,
          description,
          created_date: new Date().toISOString(),
        });

        setContents((prev) => [res.data, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Та устгахдаа итгэлтэй байна уу?");
    if (!confirmed) return;
    try {
      await axios.delete(`http://localhost:5001/api/content/${id}`);
      setContents(contents.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setEditId(null);
    setModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top controls */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Видео контент хайх ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
        >
          + Видео контент нэмэх
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            Searching ...
          </p>
        )}
        {currentItems.map((item) => (
          <Card
            key={item.id}
            className="p-4 flex flex-col gap-2 shadow-md rounded-2xl"
          >
            <div className="w-full h-52">
              {item.url.includes("youtube") && (
                <iframe
                  src={item.url.replace("watch?v=", "embed/")}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            <h3 className="font-bold text-lg mt-2">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.description}</p>
            <p className="text-xs text-muted-foreground">
              {item.updated_date
                ? `Updated: ${new Date(item.updated_date).toLocaleDateString()}`
                : `Created: ${new Date(
                    item.created_date
                  ).toLocaleDateString()}`}
            </p>

            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditId(item.id);
                  setTitle(item.title);
                  setUrl(item.url);
                  setDescription(item.description || "");
                  setCreatedDate(
                    item.created_date
                      ? new Date(item.created_date).toISOString().split("T")[0]
                      : ""
                  );
                  setModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={currentPage === i + 1 ? "default" : "outline"}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Content" : "Create Content"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {editId && (
              <Input
                type="date"
                value={
                  createdDate
                    ? new Date(createdDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => setCreatedDate(e.target.value)}
              />
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
