"use client";

import { useEffect, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl,
  FaLink,
  FaUnlink,
  FaUndo,
  FaRedo,
} from "react-icons/fa";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  id,
  disabled = false,
  className = "",
}: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Keyboard shortcuts handler - defined before editor to avoid closure issues
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleKeyDown = useCallback((_view: unknown, _event: KeyboardEvent) => {
    // We'll handle shortcuts in the component instead of here to avoid closure issues
    return false;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `min-h-40 rounded-md border border-amber-500/30 bg-gradient-to-br from-blue-900/40 to-blue-800/30 px-3 py-2 text-sm text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400/50 transition-all duration-200 relative ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-800/20"
            : "hover:border-amber-400/40"
        } ${className}`,
        "data-placeholder": placeholder,
        "data-empty": "true",
        style: `
          --tw-prose-body: rgb(245 245 244);
          --tw-prose-headings: rgb(253 224 71);
          --tw-prose-links: rgb(253 224 71);
          --tw-prose-bold: rgb(253 224 71);
          --tw-prose-counters: rgb(156 163 175);
          --tw-prose-bullets: rgb(156 163 175);
          --tw-prose-hr: rgb(75 85 99);
          --tw-prose-quotes: rgb(245 245 244);
          --tw-prose-quote-borders: rgb(253 224 71);
          --tw-prose-captions: rgb(156 163 175);
          --tw-prose-code: rgb(253 224 71);
          --tw-prose-pre-code: rgb(245 245 244);
          --tw-prose-pre-bg: rgb(31 41 55);
          --tw-prose-th-borders: rgb(75 85 99);
          --tw-prose-td-borders: rgb(55 65 81);
        `,
      },
      handleKeyDown,
    },
  });

  // Custom placeholder effect
  useEffect(() => {
    if (!editor) return;

    const updatePlaceholder = () => {
      const element = editor.view.dom;
      const hasContent = editor.getText().trim().length > 0;
      element.setAttribute("data-empty", hasContent ? "false" : "true");
    };

    editor.on("update", updatePlaceholder);
    updatePlaceholder(); // Initial check

    return () => {
      editor.off("update", updatePlaceholder);
    };
  }, [editor, placeholder]);

  // Keyboard shortcuts - properly implemented after editor is defined
  useEffect(() => {
    if (!editor) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!editor.isEditable) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "b":
            event.preventDefault();
            editor.chain().focus().toggleBold().run();
            break;
          case "i":
            event.preventDefault();
            editor.chain().focus().toggleItalic().run();
            break;
          case "z":
            event.preventDefault();
            if (event.shiftKey) {
              editor.chain().focus().redo().run();
            } else {
              editor.chain().focus().undo().run();
            }
            break;
          case "y":
            event.preventDefault();
            editor.chain().focus().redo().run();
            break;
        }
      }
    };

    // Only add listener when editor is focused
    const handleFocus = () => {
      document.addEventListener("keydown", handleGlobalKeyDown);
    };

    const handleBlur = () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };

    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [editor]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (value !== currentContent) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  // Toolbar action handlers
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;

    // Check if Link extension is available
    const hasLinkExtension = editor.extensionManager.extensions.some(
      (ext) => ext.name === "link",
    );

    if (!hasLinkExtension) {
      // Fallback to simple prompt if Link extension not available
      const url = window.prompt("Enter URL:", "");
      if (url && url.trim()) {
        // Security: Validate URL to prevent XSS
        const isValidUrl = (inputUrl: string): boolean => {
          try {
            const parsed = new URL(inputUrl);
            return ["http:", "https:"].includes(parsed.protocol);
          } catch {
            return false;
          }
        };

        if (!isValidUrl(url.trim())) {
          alert("Please enter a valid HTTP or HTTPS URL");
          return;
        }

        // Simple link insertion without proper link extension
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, " ");
        const linkText = selectedText || "link";
        // Sanitize link text
        const sanitizedText = linkText.replace(/[<>]/g, "").trim();
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url.trim()}">${sanitizedText}</a>`)
          .run();
      }
      return;
    }

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setLinkText(selectedText || "");
    setLinkUrl(editor.getAttributes("link").href || "");
    setIsLinkDialogOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    const trimmedUrl = linkUrl.trim();
    const trimmedText = linkText.trim();

    // Security: Validate URL to prevent XSS
    const isValidUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    };

    if (!trimmedUrl) {
      // Allow empty URL to clear link
      setIsLinkDialogOpen(false);
      setLinkUrl("");
      setLinkText("");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      alert("Please enter a valid HTTP or HTTPS URL");
      return;
    }

    // Sanitize link text to prevent XSS
    const sanitizedText = trimmedText.replace(/[<>]/g, "").trim();

    if (sanitizedText) {
      // Replace selected text with link
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${trimmedUrl}">${sanitizedText}</a>`)
        .run();
    } else {
      // Apply link to selected text
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: trimmedUrl })
        .run();
    }

    setIsLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  }, [editor, linkUrl, linkText]);

  const removeLink = useCallback(() => {
    if (!editor) return;

    const hasLinkExtension = editor.extensionManager.extensions.some(
      (ext) => ext.name === "link",
    );

    if (hasLinkExtension) {
      editor.chain().focus().unsetLink().run();
    } else {
      // Fallback: user needs to manually remove link tags
      alert(
        "Link extension not available. Please manually remove link HTML tags.",
      );
    }
  }, [editor]);

  // Loading state
  if (!editor) {
    return (
      <div
        className={`min-h-40 rounded-md border border-amber-500/30 bg-blue-900/40 animate-pulse ${className}`}
        aria-label="Loading rich text editor"
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Enhanced Toolbar with distinctive design */}
        <div className="flex flex-wrap items-center gap-1 p-3 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-amber-500/20 rounded-t-lg backdrop-blur-sm">
          {/* History controls with subtle glow */}
          <div className="flex items-center gap-1 p-1 bg-black/20 rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!editor.can().undo() || disabled}
              className="h-7 w-7 p-0 text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 transition-all duration-200"
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              <FaUndo className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!editor.can().redo() || disabled}
              className="h-7 w-7 p-0 text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 transition-all duration-200"
              aria-label="Redo"
              title="Redo (Ctrl+Y)"
            >
              <FaRedo className="h-3 w-3" />
            </Button>
          </div>

          <div className="w-px h-6 bg-amber-500/30 mx-2" />

          {/* Text formatting with enhanced styling */}
          <div className="flex items-center gap-1 p-1 bg-black/20 rounded-md">
            <Button
              type="button"
              variant={editor.isActive("bold") ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleBold}
              disabled={disabled}
              className={`h-7 w-7 p-0 transition-all duration-200 ${
                editor.isActive("bold")
                  ? "bg-amber-500/30 text-amber-100 shadow-lg shadow-amber-500/20"
                  : "text-amber-300 hover:text-amber-100 hover:bg-amber-500/20"
              }`}
              aria-label="Toggle bold"
              title="Bold (Ctrl+B)"
              aria-pressed={editor.isActive("bold")}
            >
              <FaBold className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive("italic") ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleItalic}
              disabled={disabled}
              className={`h-7 w-7 p-0 transition-all duration-200 ${
                editor.isActive("italic")
                  ? "bg-blue-500/30 text-blue-100 shadow-lg shadow-blue-500/20"
                  : "text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
              }`}
              aria-label="Toggle italic"
              title="Italic (Ctrl+I)"
              aria-pressed={editor.isActive("italic")}
            >
              <FaItalic className="h-3 w-3" />
            </Button>
          </div>

          <div className="w-px h-6 bg-amber-500/30 mx-2" />

          {/* Lists with unique styling */}
          <div className="flex items-center gap-1 p-1 bg-black/20 rounded-md">
            <Button
              type="button"
              variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleBulletList}
              disabled={disabled}
              className={`h-7 w-7 p-0 transition-all duration-200 ${
                editor.isActive("bulletList")
                  ? "bg-purple-500/30 text-purple-100 shadow-lg shadow-purple-500/20"
                  : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
              }`}
              aria-label="Toggle bullet list"
              aria-pressed={editor.isActive("bulletList")}
            >
              <FaListUl className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleOrderedList}
              disabled={disabled}
              className={`h-7 w-7 p-0 transition-all duration-200 ${
                editor.isActive("orderedList")
                  ? "bg-green-500/30 text-green-100 shadow-lg shadow-green-500/20"
                  : "text-green-300 hover:text-green-100 hover:bg-green-500/20"
              }`}
              aria-label="Toggle ordered list"
              aria-pressed={editor.isActive("orderedList")}
            >
              <FaListOl className="h-3 w-3" />
            </Button>
          </div>

          <div className="w-px h-6 bg-amber-500/30 mx-2" />

          {/* Links with distinctive styling */}
          <div className="flex items-center gap-1 p-1 bg-black/20 rounded-md">
            <Button
              type="button"
              variant={
                editor.extensionManager.extensions.some(
                  (ext) => ext.name === "link",
                ) && editor.isActive("link")
                  ? "secondary"
                  : "ghost"
              }
              size="sm"
              onClick={openLinkDialog}
              disabled={disabled}
              className={`h-7 w-7 p-0 transition-all duration-200 ${
                editor.extensionManager.extensions.some(
                  (ext) => ext.name === "link",
                ) && editor.isActive("link")
                  ? "bg-cyan-500/30 text-cyan-100 shadow-lg shadow-cyan-500/20"
                  : "text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20"
              }`}
              aria-label="Add or edit link"
              title={
                editor.extensionManager.extensions.some(
                  (ext) => ext.name === "link",
                )
                  ? "Add or edit link"
                  : "Add link (basic mode - install @tiptap/extension-link for full functionality)"
              }
              aria-pressed={
                editor.extensionManager.extensions.some(
                  (ext) => ext.name === "link",
                ) && editor.isActive("link")
              }
            >
              <FaLink className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeLink}
              disabled={
                !editor.extensionManager.extensions.some(
                  (ext) => ext.name === "link",
                ) ||
                !editor.isActive("link") ||
                disabled
              }
              className="h-7 w-7 p-0 text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-all duration-200"
              aria-label="Remove link"
              title={
                editor.extensionManager.extensions.some(
                  (ext) => ext.name === "link",
                )
                  ? "Remove link"
                  : "Remove link (requires @tiptap/extension-link)"
              }
            >
              <FaUnlink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Editor content with enhanced styling */}
        <div className="relative">
          <EditorContent
            id={id}
            editor={editor}
            className={`rounded-b-lg overflow-hidden ${
              disabled ? "cursor-not-allowed" : ""
            }`}
            aria-label={placeholder || "Rich text editor"}
            role="textbox"
            aria-multiline="true"
            aria-describedby={id ? `${id}-description` : undefined}
          />

          {/* Custom placeholder */}
          {editor && !editor.getText().trim() && !disabled && (
            <div className="absolute top-2 left-3 text-amber-400/60 italic pointer-events-none select-none">
              {placeholder}
            </div>
          )}

          {/* Subtle animated border effect */}
          <div className="absolute inset-0 rounded-b-lg pointer-events-none bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Enhanced screen reader description */}
        {id && (
          <div id={`${id}-description`} className="sr-only">
            Rich text editor with formatting options. Use toolbar buttons or
            keyboard shortcuts: Ctrl+B for bold, Ctrl+I for italic, Ctrl+Z for
            undo, Ctrl+Y for redo. Navigate with Tab key and activate buttons
            with Enter or Space.
          </div>
        )}
      </div>

      {/* Enhanced Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-amber-500/20 shadow-2xl shadow-amber-500/10">
          <DialogHeader>
            <DialogTitle className="text-amber-100 text-lg font-semibold flex items-center gap-2">
              <FaLink className="h-5 w-5 text-cyan-400" />
              Add Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="link-text"
                className="text-sm font-medium text-amber-200/80 mb-2 block"
              >
                Link Text (optional)
              </label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Text to display"
                className="bg-slate-800/50 border-amber-500/30 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
              />
            </div>
            <div>
              <label
                htmlFor="link-url"
                className="text-sm font-medium text-amber-200/80 mb-2 block"
              >
                URL
              </label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-slate-800/50 border-amber-500/30 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLinkDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-amber-200 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={applyLink}
              disabled={!linkUrl.trim()}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FaLink className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
