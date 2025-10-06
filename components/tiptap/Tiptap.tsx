'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Superscript } from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";

const Tiptap = () => {
  const editor = useEditor({
    extensions: [StarterKit,Superscript,
  Subscript,],
    content: '<p>Hello World! 🌎️</p>',
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  })

  return <EditorContent editor={editor} />
}

export default Tiptap