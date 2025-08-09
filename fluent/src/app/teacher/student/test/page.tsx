"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";
import { splitBlock } from "prosemirror-commands";
import { useEffect, useState } from "react";


const PersistentHeading = Extension.create({
  name: "persistentHeading",
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state, dispatch } = editor.view;
        const { $from } = state.selection;
        const node = $from.node();
        if (node.type.name.startsWith("heading")) {
          const level = node.attrs.level;
          const shouldKeepHighlight = editor.isActive("highlight");
          splitBlock(state, dispatch);
          editor.commands.setNode("heading", { level });
          if (shouldKeepHighlight) editor.commands.setMark("highlight");
          return true;
        }
        return false;
      },
    };
  },
});

const CustomHighlight = Highlight.extend({
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
    };
  },
});


function TestPage() {
  const searchParams = useSearchParams();
  const student_name = searchParams.get("student_name") || "";
  const title = searchParams.get("title") || "";

  const [original_text, setOriginal_text] = useState("");
  const editor = useEditor({
    extensions: [StarterKit, CustomHighlight, Underline, PersistentHeading],
    content: original_text,
    onUpdate: ({ editor }) => {
      setOriginal_text(editor.getHTML());
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/test?student_name=${encodeURIComponent(
            student_name
          )}&title=${encodeURIComponent(title)}`
        );
        const data = await res.json();
        if (data?.html) {
          setOriginal_text(data.html);
          editor?.commands.setContent(data.html);
        }
      } catch (err) {
        console.error("Failed to load test material", err);
      }
    };

    if (editor) fetchData();
  }, [editor]);

  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name,
          title,
          text: original_text,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      alert("Update successful!");
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white mb-5 rounded-2xl p-4 shadow-sm border border-[#F2F4F6] shrink-0">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("bold")
                ? "bg-[#3182F6] text-white shadow-sm"
                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
            }`}
          >
            Bold
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("italic")
                ? "bg-[#3182F6] text-white shadow-sm"
                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
            }`}
          >
            Italic
          </button>
          <button
            type="button"
            onClick={() =>
              editor?.chain().focus().toggleUnderline().run()
            }
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("underline")
                ? "bg-[#3182F6] text-white shadow-sm"
                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
            }`}
          >
            Underline
          </button>
          <button
            type="button"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("heading", { level: 1 })
                ? "bg-[#3182F6] text-white shadow-sm"
                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
            }`}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("heading", { level: 2 })
                ? "bg-[#3182F6] text-white shadow-sm"
                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
            }`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("heading", { level: 3 })
                ? "bg-[#3182F6] text-white shadow-sm"
                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
            }`}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editor) return;

              const { state } = editor;
              const { from, to } = state.selection;
              const paragraphs: {
                start: number;
                end: number;
                text: string;
              }[] = [];

              // Step 1: Collect paragraph ranges
              state.doc.nodesBetween(from, to, (node, pos) => {
                if (node.type.name === "paragraph") {
                  const text = node.textContent.trim();
                  if (text.length > 0) {
                    paragraphs.push({
                      start: pos,
                      end: pos + node.nodeSize,
                      text,
                    });
                  }
                }
              });

              // Step 2: Apply numbering from bottom to top to avoid offset shift
              paragraphs
                .slice()
                .reverse()
                .forEach(({ start, end, text }, idx, arr) => {
                  const number = arr.length - idx; // Top-down numbering
                  editor.commands.insertContentAt(
                    { from: start, to: end },
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: `${number}. ${text}`,
                        },
                      ],
                    }
                  );
                });

              editor.chain().focus().run();
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
          >
            Numbering
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setParagraph().run()}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("paragraph")
                ? "bg-[#3182F6] text-white shadow-sm"
                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
            }`}
          >
            Paragraph
          </button>
          <button
            type="button"
            onClick={() =>
              editor?.chain().focus().toggleHighlight().run()
            }
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              editor?.isActive("highlight")
                ? "bg-[#FFE066] text-black shadow-sm"
                : "bg-[#FFE066] text-black hover:bg-[#FFCC02]"
            }`}
          >
            Highlight
          </button>
        </div>
      </div>

      <div className="overflow-y-auto border border-[#F2F4F6] rounded-2xl p-6 bg-white shadow-sm">
        <EditorContent
          editor={editor}
          className="prose max-w-none h-[600px] custom-editor"
        />
      </div>

      <div className="mt-6">
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update
        </button>
      </div>
    </div>
  );
}


export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestPage />
    </Suspense>
  );
}

