"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bold,
  Check,
  ChevronDown,
  Eye,
  Italic,
  Loader2,
  Palette,
  PenLine,
  Plus,
  Save,
  TriangleAlert,
  Underline,
} from "lucide-react";
import { Button } from "@/frontend/components/ui";
import { ArticleContent } from "@/frontend/components/article-content";
import type { ArticleStatus, Category } from "@/backend/types";
import { cn, slugify, stripHtml } from "@/frontend/lib/utils";
import {
  createCategory,
  saveArticle,
  type ArticleFormState,
} from "@/backend/actions/articles";

export type EditorArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string | null;
  status: ArticleStatus;
  tags: string;
};

const initialState: ArticleFormState = {};

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const FONT_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Slate", value: "#334155" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#15803d" },
  { name: "Amber", value: "#b45309" },
  { name: "Red", value: "#dc2626" },
];

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 120;

const toolButton =
  "focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

export function ArticleEditor({
  categories,
  article,
}: {
  categories: Category[];
  article?: EditorArticle;
}) {
  const [state, formAction, pending] = useActionState(
    saveArticle,
    initialState,
  );
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [content, setContent] = useState(article?.content ?? "");
  const [status, setStatus] = useState<ArticleStatus>(
    article?.status ?? "draft",
  );
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [colorOpen, setColorOpen] = useState(false);
  const [color, setColor] = useState(FONT_COLORS[0].value);
  const [fontSize, setFontSize] = useState("");
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [addingCategory, startAddingCategory] = useTransition();

  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(article?.content ?? "");
  const hiddenContentRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const initialContent = useRef(article?.content ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.innerHTML = initialContent.current;
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand("styleWithCSS", false, "true");
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const words = useMemo(
    () => stripHtml(content).trim().split(/\s+/).filter(Boolean).length,
    [content],
  );

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    const selection = window.getSelection();
    if (selection && savedRange.current) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
  }

  function flushContent() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setContent(contentRef.current);
  }

  function syncContent() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const html = editor.innerHTML;
    contentRef.current = html;

    if (hiddenContentRef.current) {
      hiddenContentRef.current.value = html;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setContent(html);
    }, 250);
  }

  function runCommand(command: string, value?: string) {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    syncContent();
    saveSelection();
  }

  function applyFontSize(px: number) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    restoreSelection();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand("fontSize", false, "7");
    document.execCommand("styleWithCSS", false, "true");

    const markers = Array.from(
      editor.querySelectorAll<HTMLElement>(
        'font[size="7"], span[style*="xxx-large"]',
      ),
    );
    const wrapped: HTMLElement[] = [];

    for (const marker of markers) {
      if (marker.tagName === "FONT") {
        const span = document.createElement("span");
        span.style.fontSize = `${px}px`;
        while (marker.firstChild) {
          span.appendChild(marker.firstChild);
        }
        marker.replaceWith(span);
        wrapped.push(span);
      } else {
        marker.style.fontSize = `${px}px`;
        wrapped.push(marker);
      }
    }

    if (wrapped.length > 0) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStartBefore(wrapped[0]);
      range.setEndAfter(wrapped[wrapped.length - 1]);
      selection?.removeAllRanges();
      selection?.addRange(range);
      savedRange.current = range.cloneRange();
    }

    syncContent();
  }

  function applyFontSizeInput() {
    const size = Number(fontSize);
    if (!fontSize.trim() || !Number.isFinite(size)) {
      return;
    }

    const clamped = Math.min(
      MAX_FONT_SIZE,
      Math.max(MIN_FONT_SIZE, Math.round(size)),
    );
    applyFontSize(clamped);
    setFontSize("");
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name || addingCategory) {
      return;
    }

    setCategoryError(null);

    startAddingCategory(async () => {
      const result = await createCategory(name);

      if (!result.ok) {
        setCategoryError(result.error);
        return;
      }

      setCategoryOptions((current) => {
        if (current.some((category) => category.id === result.category.id)) {
          return current;
        }

        return [...current, result.category].sort(
          (a, b) =>
            a.sort_order - b.sort_order || a.name.localeCompare(b.name),
        );
      });
      setCategoryId(result.category.id);
      setNewCategory("");
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      {article ? <input type="hidden" name="id" value={article.id} /> : null}
      <input
        type="hidden"
        name="content"
        ref={hiddenContentRef}
        defaultValue={article?.content ?? ""}
      />

      <div>
        <Link
          href="/admin/articles"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to articles
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {article ? "Edit article" : "New article"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Use the toolbar to format text, then publish when it is ready for the
          whole team.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="surface-strong space-y-4 p-6">
            <div className="space-y-1.5">
              <label
                htmlFor="title"
                className="text-sm font-medium text-slate-700"
              >
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                value={title}
                onChange={(event) => {
                  const value = event.target.value;
                  setTitle(value);
                  if (!slugTouched) {
                    setSlug(slugify(value));
                  }
                }}
                placeholder="e.g. How to request parental leave"
                className="focus-ring w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-lg font-medium text-slate-900 placeholder:text-slate-300 transition focus:border-blue-300"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="slug"
                className="text-sm font-medium text-slate-700"
              >
                URL slug
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm transition focus-within:border-blue-300">
                <span className="shrink-0 text-slate-400">/kb/...</span>
                <input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugTouched(true);
                  }}
                  placeholder="auto-from-title"
                  className="focus-ring min-w-0 flex-1 bg-transparent py-0.5 font-mono text-xs text-slate-700 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Changing the slug breaks existing links. Leave it as-is unless
                you need to.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="summary"
                className="text-sm font-medium text-slate-700"
              >
                Summary
              </label>
              <textarea
                id="summary"
                name="summary"
                rows={3}
                defaultValue={article?.summary ?? ""}
                placeholder="One or two lines shown on cards and search results."
                className="focus-ring w-full resize-y rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition focus:border-blue-300"
              />
              <p className="text-[11px] text-slate-400">
                Optional - if empty, the first 160 characters of the content
                are used.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/90">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      flushContent();
                      setTab("write");
                    }}
                    className={cn(
                      "focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                      tab === "write"
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      flushContent();
                      setTab("preview");
                    }}
                    className={cn(
                      "focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                      tab === "preview"
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  {words} {words === 1 ? "word" : "words"}
                </span>
              </div>

              <div className={tab === "write" ? "block" : "hidden"}>
                <div
                  role="toolbar"
                  aria-label="Text formatting"
                  className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-3 py-2"
                >
                  <button
                    type="button"
                    title="Bold"
                    aria-label="Bold"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => runCommand("bold")}
                    className={toolButton}
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Italic"
                    aria-label="Italic"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => runCommand("italic")}
                    className={toolButton}
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Underline"
                    aria-label="Underline"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => runCommand("underline")}
                    className={toolButton}
                  >
                    <Underline className="h-4 w-4" />
                  </button>

                  <span className="mx-1 h-5 w-px bg-slate-200" />

                  <span className="pl-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Size
                  </span>
                  <select
                    title="Preset font sizes"
                    aria-label="Preset font sizes"
                    defaultValue=""
                    onChange={(event) => {
                      const size = Number(event.target.value);
                      if (size) {
                        applyFontSize(size);
                      }
                      event.currentTarget.value = "";
                    }}
                    className="focus-ring h-8 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    <option value="">Preset</option>
                    {FONT_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>

                  <div className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 transition focus-within:border-blue-300">
                    <input
                      type="number"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      step={1}
                      value={fontSize}
                      title="Type any font size, then press Enter"
                      aria-label="Custom font size in pixels"
                      placeholder="px"
                      onChange={(event) => setFontSize(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applyFontSizeInput();
                        }
                      }}
                      onBlur={applyFontSizeInput}
                      className="focus-ring w-12 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    <span className="text-[10px] font-medium text-slate-400">
                      px
                    </span>
                  </div>

                  <span className="mx-1 h-5 w-px bg-slate-200" />

                  <span className="pl-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Color
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      title="Text color"
                      aria-label="Text color"
                      aria-haspopup="menu"
                      aria-expanded={colorOpen}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setColorOpen((open) => !open)}
                      className="focus-ring inline-flex h-8 items-center gap-1 rounded-lg px-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <span className="flex flex-col items-center gap-0.5">
                        <Palette className="h-4 w-4" />
                        <span
                          aria-hidden="true"
                          className="h-1 w-4 rounded-full ring-1 ring-slate-200"
                          style={{ backgroundColor: color }}
                        />
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {colorOpen ? (
                      <>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-hidden="true"
                          onClick={() => setColorOpen(false)}
                          className="fixed inset-0 z-10 cursor-default"
                        />
                        <div
                          role="menu"
                          aria-label="Text colors"
                          className="absolute left-0 z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/60"
                        >
                          {FONT_COLORS.map((swatch) => (
                            <button
                              key={swatch.value}
                              type="button"
                              role="menuitemradio"
                              aria-checked={color === swatch.value}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                runCommand("foreColor", swatch.value);
                                setColor(swatch.value);
                                setColorOpen(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                            >
                              <span
                                className="h-4 w-4 rounded-full ring-1 ring-slate-300"
                                style={{ backgroundColor: swatch.value }}
                              />
                              <span className="flex-1">{swatch.name}</span>
                              {color === swatch.value ? (
                                <Check className="h-3.5 w-3.5 text-blue-600" />
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Article content"
                  data-placeholder="Start writing your article..."
                  onInput={syncContent}
                  onMouseUp={saveSelection}
                  onKeyUp={saveSelection}
                  className="article-content article-editor min-h-[28rem] px-5 py-4 focus:outline-none"
                />
              </div>

              {tab === "preview" ? (
                <div className="min-h-[28rem] px-5 py-4">
                  {content.trim() ? (
                    <ArticleContent content={content} />
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      Nothing to preview yet. Start writing in the Write tab.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {state.error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface space-y-4 p-5">
            <div className="space-y-1">
              <label
                htmlFor="status"
                className="text-xs font-medium text-slate-600"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ArticleStatus)
                }
                className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-blue-300"
              >
                <option value="draft">Draft - only HR can see</option>
                <option value="published">Published - visible to everyone</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="category_id"
                className="text-xs font-medium text-slate-600"
              >
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-blue-300"
              >
                <option value="">No category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 pt-1">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCategory();
                    }
                  }}
                  placeholder="New category name"
                  aria-label="New category name"
                  className="focus-ring min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-blue-300"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={addingCategory || !newCategory.trim()}
                  title="Add category"
                  aria-label="Add category"
                  className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingCategory ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>
              {categoryError ? (
                <p className="text-[11px] text-rose-600">{categoryError}</p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Type a name and press Enter to create a new category.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="tags"
                className="text-xs font-medium text-slate-600"
              >
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                defaultValue={article?.tags ?? ""}
                placeholder="leave, payroll, benefits"
                className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-blue-300"
              />
              <p className="text-[11px] text-slate-400">
                Comma-separated. New tags are created automatically.
              </p>
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {status === "published" ? "Save & publish" : "Save draft"}
                </>
              )}
            </Button>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-blue-700">Publishing checklist</p>
            <ul className="mt-2 space-y-1.5">
              <li>- Title and summary are clear.</li>
              <li>- Steps are ordered and specific.</li>
              <li>- Links and names are up to date.</li>
              <li>- Tags make it findable in search.</li>
            </ul>
          </div>
        </aside>
      </div>
    </form>
  );
}
