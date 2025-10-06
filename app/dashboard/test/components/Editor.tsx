"use client";

import { useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { JSONContent } from "@tiptap/core";

type EditorProps = {
  initial?: JSONContent;
  onChange: (json: JSONContent) => void;
  onSave?: (json: JSONContent) => void;
};

export default function Editor({ initial, onChange, onSave }: EditorProps) {
  const [fileUploading, setFileUploading] = useState(false);

  const editor = useEditor({
  extensions: [StarterKit, Image],
  content: initial || '<p></p>',
  onUpdate: ({ editor }) => onChange(editor.getJSON()),
  editorProps: { attributes: { class: 'prose p-2 focus:outline-none' } },
  immediatelyRender: false, // ✅ SSR-д аюулгүй
})


  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  // Image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    setFileUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5001/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err) {
      console.error(err);
    } finally {
      setFileUploading(false);
    }
  };
  

  const handleSave = () => {
  if (editor) {
    onSave?.(editor.getJSON())
  }
}

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-2 flex gap-2">
        <button onClick={() => editor?.chain().focus().toggleBold().run()}>
          B
        </button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()}>
          I
        </button>
        <button onClick={() => editor?.chain().focus().setParagraph().run()}>
          P
        </button>

        <label className="cursor-pointer bg-gray-200 px-2 py-1 rounded">
          Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        <button
          className="bg-blue-500 text-white px-2 py-1 rounded"
          onClick={handleSave}
          disabled={fileUploading}
        >
          {fileUploading ? "Uploading..." : "Save"}
        </button>
      </div>

      <EditorContent editor={editor} className="border p-3 min-h-[200px]" />
    </div>
  );
}
