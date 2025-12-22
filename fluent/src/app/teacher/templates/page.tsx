"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";

type TemplateLevel = "beginner" | "intermediate" | "business";

type Template = {
  _id: string;              // ✅ ADD THIS
  template_name: string;
  html: string;
  level: TemplateLevel;
};


export default function TeacherTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<TemplateLevel>("beginner");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const groupedTemplates: Record<TemplateLevel, Template[]> = {
    beginner: [],
    intermediate: [],
    business: [],
    };

    templates.forEach((t) => {
    groupedTemplates[t.level || "beginner"].push(t);
  });


  /* ---------------- TipTap (same extensions as class note) ---------------- */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
    ],
    content: "",
    autofocus: false,
  });

  /* ---------------- Fetch template list ---------------- */
  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/classnote/template");
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch templates", err);
      setTemplates([]);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  /* ---------------- Load template ---------------- */
  const loadTemplate = async (id: string) => {
    if (!editor) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/classnote/template?id=${id}`);
      const data = await res.json();

        setSelected(data);
        setSelectedLevel(data.level || "beginner");
        editor.commands.setContent(data.html || "");

    } catch (err) {
      console.error("Failed to load template", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Create template ---------------- */
  const createTemplate = async () => {
    if (!newName.trim()) return;

    await fetch("/api/classnote/template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      template_name: newName.trim(),
      html: "",
      level: "beginner", // default
      }),
    });

    setNewName("");
    fetchTemplates();
  };

  /* ---------------- Save template (MANUAL ONLY) ---------------- */
  const saveTemplate = async () => {
    if (!selected || !editor) return;

    await fetch(
      `/api/classnote/template?template_name=${encodeURIComponent(
        selected.template_name
      )}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        html: editor.getHTML(),
        level: selectedLevel,
        }),
      }
    );

    alert("Template saved");
    fetchTemplates();
  };

  /* ---------------- Delete template ---------------- */
  const deleteTemplate = async () => {
    if (!selected) return;
    if (!confirm("Delete this template?")) return;

    await fetch(
      `/api/classnote/template?template_name=${encodeURIComponent(
        selected.template_name
      )}`,
      { method: "DELETE" }
    );

    setSelected(null);
    editor?.commands.setContent("");
    fetchTemplates();
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F8F9FA]">
      {/* ================= LEFT: TEMPLATE LIST ================= */}
      <aside className="w-[280px] bg-white border-r border-[#F2F4F6] p-4 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#191F28]">Templates</h2>

        {/* Create */}
        <div className="flex gap-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="template_name"
            className="flex-1 px-3 py-2 text-xs border rounded-xl"
          />
          <button
            onClick={createTemplate}
            className="px-3 py-2 text-xs rounded-xl bg-[#3182F6] text-white font-bold"
          >
            +
          </button>
        </div>

        {/* List (GROUPED BY LEVEL) */}
        <div className="flex-1 overflow-y-auto space-y-4">
        {(["beginner", "intermediate", "business"] as TemplateLevel[]).map(
            (level) => (
            <div key={level}>
                <h3 className="text-[11px] font-bold text-[#8B95A1] uppercase mb-1">
                {level}
                </h3>

                <div className="space-y-1">
                {groupedTemplates[level].map((t) => (
                    <button
                    key={t._id}                       
                    onClick={() => loadTemplate(t._id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                        selected?._id === t._id
                        ? "bg-[#E7F1FF] font-semibold text-[#3182F6]"
                        : "hover:bg-[#F8F9FA]"
                    }`}
                    >
                    {t.template_name}
                    </button>
                ))}
                </div>
            </div>
            )
        )}
        </div>

      </aside>

      {/* ================= RIGHT: EDITOR ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-[#F2F4F6] px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#191F28]">
            {selected?.template_name || "Select a template"}
          </h1>

        {selected && (
        <div className="flex items-center gap-3">
            {/* LEVEL SELECTOR */}
            <select
            value={selectedLevel}
            onChange={(e) =>
                setSelectedLevel(e.target.value as TemplateLevel)
            }
            className="px-3 py-2 text-sm border rounded-xl bg-white"
            >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="business">Business</option>
            </select>

            <button
            onClick={saveTemplate}
            className="px-4 py-2 text-sm rounded-xl bg-[#3182F6] text-white font-semibold"
            >
            Save
            </button>

            <button
            onClick={deleteTemplate}
            className="px-4 py-2 text-sm rounded-xl border border-red-300 text-red-500 font-semibold"
            >
            Delete
            </button>
        </div>
        )}

        </div>

        {/* Toolbar (copied logic style from class note) */}
        <div className="p-4 bg-white border-b border-[#F2F4F6]">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                editor?.isActive("bold")
                  ? "bg-[#3182F6] text-white"
                  : "bg-[#F8F9FA]"
              }`}
            >
              Bold
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                editor?.isActive("italic")
                  ? "bg-[#3182F6] text-white"
                  : "bg-[#F8F9FA]"
              }`}
            >
              Italic
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                editor?.isActive("underline")
                  ? "bg-[#3182F6] text-white"
                  : "bg-[#F8F9FA]"
              }`}
            >
              Underline
            </button>

            {([1, 2, 3] as const).map((level) => (
            <button
                key={level}
                onClick={() =>
                editor?.chain().focus().toggleHeading({ level }).run()
                }
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                editor?.isActive("heading", { level })
                    ? "bg-[#3182F6] text-white"
                    : "bg-[#F8F9FA]"
                }`}
            >
                H{level}
            </button>
            ))}


            <button
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FFE066]"
            >
              Highlight
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <EditorContent
            editor={editor}
            className="prose max-w-none min-h-[400px]"
          />
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
}
