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

interface VideoNewsItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  meta?: string;
  created_at: string;
  updated_at?: string;
}

export default function VideoNews() {
  const [news, setNews] = useState<VideoNewsItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(6);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal state for add/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newMeta, setNewMeta] = useState("");
  const [newCreatedAt, setNewCreatedAt] = useState("");

  // Fetch video news
  useEffect(() => {
    axios.get("http://localhost:5001/api/videonews").then((res) => {
      if (Array.isArray(res.data)) setNews(res.data);
      else if (Array.isArray(res.data.data)) setNews(res.data.data);
      else setNews([]);
    });
  }, []);

  const filtered = Array.isArray(news)
    ? news.filter(
        (n) =>
          typeof n.title === "string" &&
          typeof search === "string" &&
          n.title.toLowerCase().includes(search.toLowerCase())
      )
    : [];
  const lastIndex = currentPage * perPage;
  const firstIndex = lastIndex - perPage;
  const currentItems = filtered.slice(firstIndex, lastIndex);

  function getYoutubeEmbedUrl(url: string): string | null {
    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes("youtube.com")) {
        const videoId = parsed.searchParams.get("v");
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }

      // youtu.be/xxxx
      if (parsed.hostname === "youtu.be") {
        const videoId = parsed.pathname.slice(1);
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }

      return null;
    } catch {
      return null;
    }
  }

  const handleSave = async () => {
    if (!newTitle || !newUrl) return;

    try {
      if (editId) {
        const payload: {
          title: string;
          description: string;
          url: string;
          meta: string;
          updated_at?: string;
        } = {
          title: newTitle,
          description: newDescription,
          url: newUrl,
          meta: newMeta,
        };

        if (editId && newCreatedAt) {
          payload.updated_at = new Date(newCreatedAt).toISOString();
        }
        const res = await axios.put(
          `http://localhost:5001/api/videonews/${editId}`,
          payload
        );

        const updatedItem = res.data?.data ?? res.data;

        setNews((prev) => prev.map((n) => (n.id === editId ? updatedItem : n)));
      } else {
        // Add
        const res = await axios.post("http://localhost:5001/api/videonews", {
          title: newTitle,
          description: newDescription,
          url: newUrl,
          meta: newMeta,
        });

        const newItem = res.data?.data ?? res.data;
        setNews((prev) => [newItem, ...prev]);
        setCurrentPage(1);
      }

      setModalOpen(false);
      setEditId(null);
      setNewTitle("");
      setNewDescription("");
      setNewUrl("");
      setNewMeta("");
      setNewCreatedAt("");
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await axios.delete(`http://localhost:5001/api/videonews/${deleteId}`);
    setNews(news.filter((n) => n.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Видео мэдээ хайх ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => {
            setModalOpen(true);
            setEditId(null);
            setNewTitle("");
            setNewDescription("");
            setNewUrl("");
            setNewMeta("");
            setNewCreatedAt("");
          }}
        >
          + Видео мэдээ нэмэх
        </Button>
      </div>

      {/* Video News List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((item) => (
          <Card
            key={item.id}
            className="p-4 flex flex-col gap-2 shadow-md rounded-xl"
          >
            <div className="w-full h-52">
              {item.url && getYoutubeEmbedUrl(item.url) ? (
                <iframe
                  src={getYoutubeEmbedUrl(item.url) || ""}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : item.url ? (
                <video
                  src={item.url}
                  controls
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : null}
            </div>

            <h3 className="font-bold text-lg mt-2">{item.title}</h3>
            <p className="text-xs text-muted-foreground">
              {item.updated_at && item.updated_at !== item.created_at
                ? `Updated: ${new Date(item.updated_at).toLocaleDateString()}`
                : `Created: ${new Date(item.created_at).toLocaleDateString()}`}
            </p>

            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditId(item.id);
                  setModalOpen(true);
                  setNewTitle(item.title);
                  setNewDescription(item.description || "");
                  setNewUrl(item.url);
                  setNewMeta(item.meta || "");
                  setNewCreatedAt(item.created_at);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteId(item.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Та устгахдаа итгэлтэй байна уу?</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            Энэ үйлдлийг буцаах боломжгүй. Мэдээ устах болно.
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Болих
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Тийм, устга
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Video News" : "New Video News"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Input
              placeholder="URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <Input
              placeholder="Meta"
              value={newMeta}
              onChange={(e) => setNewMeta(e.target.value)}
            />
            {editId && (
              <Input
                type="date"
                value={
                  newCreatedAt
                    ? new Date(newCreatedAt).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => setNewCreatedAt(e.target.value)}
              />
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
