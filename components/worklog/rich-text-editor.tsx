"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const toolbarButtonBase =
  "px-2 py-1 text-xs font-semibold rounded border border-amber-500/40 text-amber-500 hover:bg-amber-500/10";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-40 rounded-md border border-amber-500/30 bg-blue-900/40 px-3 py-2 text-sm text-amber-100 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-40 rounded-md border border-amber-500/30 bg-blue-900/40" />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Editor">
        <button
          type="button"
          className={toolbarButtonBase}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={editor.isActive("bold")}
        >
          Bold
        </button>
        <button
          type="button"
          className={toolbarButtonBase}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-pressed={editor.isActive("italic")}
        >
          Italic
        </button>
        <button
          type="button"
          className={toolbarButtonBase}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-pressed={editor.isActive("bulletList")}
        >
          Bullets
        </button>
        <button
          type="button"
          className={toolbarButtonBase}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-pressed={editor.isActive("orderedList")}
        >
          Numbered
        </button>
        <button
          type="button"
          className={toolbarButtonBase}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-pressed={editor.isActive("codeBlock")}
        >
          Code
        </button>
      </div>
      <EditorContent
        id={id}
        editor={editor}
        aria-label={placeholder || "Worklog description"}
      />
    </div>
  );
}
