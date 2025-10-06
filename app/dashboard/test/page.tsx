'use client'
import { useState } from "react";
import { JSONContent } from "@tiptap/core";
import Editor from "./components/Editor";

export default function CreateArticlePage() {
  const [content, setContent] = useState<JSONContent>({
    type: "doc",
    content: [],
  });

  const handleSave = async (json: JSONContent) => {
    try {
      const res = await fetch("http://localhost:5001/api/test/", {  // backend-д /api/test endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: json }),
      });

      if (res.ok) {
        alert("Saved successfully!")
      } else {
        const data = await res.json();
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-2xl mb-4">Create Article</h1>
      <Editor initial={content} onChange={setContent} onSave={handleSave} />
    </div>
  );
}
