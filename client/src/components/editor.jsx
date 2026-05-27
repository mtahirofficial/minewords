import { useState, useRef, useEffect, useCallback } from "react";

/* ── SVG Icon helpers ──────────────────────────────────────── */
const Icon = ({
  d,
  viewBox = "0 0 24 24",
  fill = "none",
  stroke = "currentColor",
}) => (
  <svg
    viewBox={viewBox}
    fill={fill}
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/* ── Colour palette ────────────────────────────────────────── */
const PALETTE = [
  "#1a1814",
  "#6b6760",
  "#b0ada8",
  "#ffffff",
  "#c4622d",
  "#8f3e17",
  "#f0ddd4",
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#0891b2",
  "#f59e0b",
  "#84cc16",
  "#f43f5e",
  "#6366f1",
  "#10b981",
  "#fbbf24",
  "#a3e635",
  "#e879f9",
  "#38bdf8",
  "#fb923c",
  "#a8a29e",
];

/* ── Main Component ────────────────────────────────────────── */
export default function Editor({
  value = "",
  onChange,
  placeholder = "Start writing your document...",
  className = "",
} = {}) {
  const editorRef = useRef(null);
  const lastSelectionRangeRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState(new Set());
  const [activeColor, setActiveColor] = useState("#1a1814");
  const [activeBg, setActiveBg] = useState("transparent");
  const [colorPopover, setColorPopover] = useState(null); // 'text' | 'bg' | null
  const [stats, setStats] = useState({ words: 0, chars: 0, lines: 1 });
  const [savedAt, setSavedAt] = useState(null);
  const isProgrammaticSyncRef = useRef(false);
  const colorTextRef = useRef(null);
  const colorBgRef = useRef(null);
  const popoverRef = useRef(null);

  /* ── Update stats ─────────────────────────────────────────── */
  const updateStats = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines =
      el.querySelectorAll("p, div, h1, h2, h3, h4, h5, h6, li, blockquote, pre")
        .length || 1;
    setStats({ words, chars, lines });
  }, []);

  /* ── Detect active formats ────────────────────────────────── */
  const detectFormats = useCallback(() => {
    const formats = new Set();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("strikeThrough")) formats.add("strike");
    if (document.queryCommandState("justifyLeft")) formats.add("alignLeft");
    if (document.queryCommandState("justifyCenter")) formats.add("alignCenter");
    if (document.queryCommandState("justifyRight")) formats.add("alignRight");
    if (document.queryCommandState("justifyFull")) formats.add("alignJustify");
    if (document.queryCommandState("insertOrderedList"))
      formats.add("orderedList");
    if (document.queryCommandState("insertUnorderedList"))
      formats.add("unorderedList");
    setActiveFormats(formats);
  }, []);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    if (typeof onChange !== "function") return;
    onChange(el.innerHTML || "");
  }, [onChange]);

  const saveSelection = useCallback(() => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    lastSelectionRangeRef.current = sel.getRangeAt(0);
  }, []);

  const restoreSelection = useCallback(() => {
    if (typeof window === "undefined") return false;
    const range = lastSelectionRangeRef.current;
    if (!range) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const next = String(value || "");
    if ((el.innerHTML || "") === next) return;

    isProgrammaticSyncRef.current = true;
    el.innerHTML = next;
    updateStats();
    setTimeout(() => {
      isProgrammaticSyncRef.current = false;
    }, 0);
  }, [value, updateStats]);

  /* ── Initialize editor empty state ──────────────────────── */
  useEffect(() => {
    const el = editorRef.current;
    if (el) el.dataset.empty = "true";
  }, []);

  /* ── Close popover on outside click ──────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !colorTextRef.current?.contains(e.target) &&
        !colorBgRef.current?.contains(e.target)
      ) {
        setColorPopover(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Auto-save mock ───────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setSavedAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── execCommand wrapper ──────────────────────────────────── */
  const exec = (cmd, value = null) => {
    restoreSelection();
    editorRef.current?.focus();
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch (_error) {
      // ignore unsupported command
    }

    const ok = document.execCommand(cmd, false, value);
    detectFormats();
    updateStats();
    if (!isProgrammaticSyncRef.current) {
      emitChange();
    }
    return ok;
  };

  /* ── Apply predefined class ───────────────────────────────── */
  const applyClass = (className) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      // wrap current block
      const block =
        range.startContainer.nodeType === 3
          ? range.startContainer.parentElement
          : range.startContainer;
      const closest = block.closest("[class]") || block;
      closest.classList.add(className);
    } else {
      const span = document.createElement("span");
      span.className = className;
      try {
        range.surroundContents(span);
      } catch {
        /* partial selection — wrap what we can */
      }
    }
    detectFormats();
    updateStats();
  };

  /* ── Insert link ──────────────────────────────────────────── */
  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (!url) return;

    exec("createLink", url);

    try {
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const anchor =
        node && node.nodeType === 1
          ? node.closest("a")
          : node?.parentElement?.closest("a");
      if (anchor) {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      }
    } catch (_error) {
      // ignore
    }
  };

  /* ── Insert image ─────────────────────────────────────────── */
  const insertImage = () => {
    const url = prompt("Enter image URL:", "https://");
    if (url) exec("insertImage", url);
  };

  /* ── Insert video (iframe) ────────────────────────────────── */
  const insertVideo = () => {
    const url = prompt("Enter YouTube/video embed URL:", "https://");
    if (url) {
      const iframe = `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:1em 0;display:block;"></iframe>`;
      exec("insertHTML", iframe);
    }
  };

  /* ── Insert table ─────────────────────────────────────────── */
  const insertTable = () => {
    const rows = 3,
      cols = 3;
    let html = `<table class="ql-table"><thead><tr>`;
    for (let c = 0; c < cols; c++) html += `<th>Header ${c + 1}</th>`;
    html += `</tr></thead><tbody>`;
    for (let r = 0; r < rows - 1; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) html += `<td>Cell</td>`;
      html += "</tr>";
    }
    html += `</tbody></table><p><br></p>`;
    exec("insertHTML", html);
  };

  /* ── Apply heading ────────────────────────────────────────── */
  const applyHeading = (value) => {
    if (!value) exec("formatBlock", "p");
    else exec("formatBlock", `h${value}`);
  };

  /* ── Apply font ───────────────────────────────────────────── */
  const applyFont = (font) => {
    if (font) exec("fontName", font);
  };

  /* ── Apply color ──────────────────────────────────────────── */
  const applyColor = (color, type) => {
    setColorPopover(null);
    if (type === "text") {
      setActiveColor(color);
      exec("foreColor", color);
    } else {
      setActiveBg(color);
      const ok = exec("hiliteColor", color);
      if (!ok) {
        exec("backColor", color);
      }
    }
  };

  /* ── Sidebar style classes ────────────────────────────────── */
  const sidebarStyles = [
    {
      key: "heading-1",
      label: "Heading 1",
      cls: "ql-h1",
      preview: "Heading 1",
    },
    {
      key: "heading-2",
      label: "Heading 2",
      cls: "ql-h2",
      preview: "Heading 2",
    },
    {
      key: "heading-3",
      label: "Heading 3",
      cls: "ql-h3",
      preview: "Heading 3",
    },
    {
      key: "body",
      label: "Body",
      cls: "ql-body",
      preview: "Body text paragraph",
    },
    {
      key: "lead",
      label: "Lead",
      cls: "ql-lead",
      preview: "Introductory lead text",
    },
    {
      key: "caption",
      label: "Caption",
      cls: "ql-caption",
      preview: "Small caption text",
    },
    {
      key: "code",
      label: "Code",
      cls: "ql-code-inline",
      preview: "const x = 42;",
    },
    {
      key: "quote",
      label: "Blockquote",
      cls: "ql-blockquote",
      preview: "Pull quote or note",
    },
  ];

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className={`editor-app ${className}`.trim()}>
      {/* <div className="">✦</div> */}

      {/* Toolbar */}
      <div className="toolbar-wrapper">
        <div className="toolbar">
          {/* Font */}
          <div className="toolbar-group">
            <select
              className="tb-select"
              onChange={(e) => applyFont(e.target.value)}
              defaultValue=""
            >
              <option value="">Font</option>
              <option value="Literata, Georgia, serif">Literata</option>
              <option value="'DM Sans', sans-serif">DM Sans</option>
              <option value="'JetBrains Mono', monospace">Mono</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="Helvetica, Arial, sans-serif">Helvetica</option>
            </select>
          </div>

          {/* Heading */}
          <div className="toolbar-group">
            <select
              className="tb-select"
              onChange={(e) => applyHeading(e.target.value)}
              defaultValue=""
            >
              <option value="">Style</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
              <option value="4">Heading 4</option>
              <option value="5">Heading 5</option>
              <option value="6">Heading 6</option>
            </select>
          </div>

          {/* Bold / Italic / Underline / Strike */}
          <div className="toolbar-group">
            <button
              type="button"
              className={`tb-btn${activeFormats.has("bold") ? " active" : ""}`}
              title="Bold"
              onMouseDown={(e) => {
                e.preventDefault();
                restoreSelection();
              }}
              onClick={() => exec("bold")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </button>
            <button
              type="button"
              className={`tb-btn${activeFormats.has("italic") ? " active" : ""}`}
              title="Italic"
              onMouseDown={(e) => {
                e.preventDefault();
                restoreSelection();
              }}
              onClick={() => exec("italic")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <button
              type="button"
              className={`tb-btn${activeFormats.has("underline") ? " active" : ""}`}
              title="Underline"
              onMouseDown={(e) => {
                e.preventDefault();
                restoreSelection();
              }}
              onClick={() => exec("underline")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
                <line x1="4" y1="21" x2="20" y2="21" />
              </svg>
            </button>
            <button
              type="button"
              className={`tb-btn${activeFormats.has("strike") ? " active" : ""}`}
              title="Strikethrough"
              onMouseDown={(e) => {
                e.preventDefault();
                restoreSelection();
              }}
              onClick={() => exec("strikeThrough")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M17.3 12.3C17.75 13 18 13.74 18 14.5a4.5 4.5 0 0 1-9 0" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <path d="M6.6 6.4C7.4 5.5 8.6 5 10 5c2.5 0 4 1.5 4 3" />
              </svg>
            </button>
          </div>

          {/* Align */}
          <div className="toolbar-group">
            <button
              type="button"
              className={`tb-btn${activeFormats.has("alignLeft") ? " active" : ""}`}
              title="Align Left"
              onClick={() => exec("justifyLeft")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="18" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              className={`tb-btn${activeFormats.has("alignCenter") ? " active" : ""}`}
              title="Center"
              onClick={() => exec("justifyCenter")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              className={`tb-btn${activeFormats.has("alignRight") ? " active" : ""}`}
              title="Align Right"
              onClick={() => exec("justifyRight")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="6" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              className={`tb-btn${activeFormats.has("alignJustify") ? " active" : ""}`}
              title="Justify"
              onClick={() => exec("justifyFull")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
          {/* Lists / Indent*/}
          <div className="toolbar-group">
            <button
              type="button"
              className={`tb-btn${activeFormats.has("orderedList") ? " active" : ""}`}
              title="Ordered List"
              onClick={() => exec("insertOrderedList")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <text
                  x="2"
                  y="8"
                  fontSize="7"
                  fill="currentColor"
                  stroke="none"
                >
                  1.
                </text>
                <text
                  x="2"
                  y="14"
                  fontSize="7"
                  fill="currentColor"
                  stroke="none"
                >
                  2.
                </text>
                <text
                  x="2"
                  y="20"
                  fontSize="7"
                  fill="currentColor"
                  stroke="none"
                >
                  3.
                </text>
              </svg>
            </button>
            <button
              type="button"
              className={`tb-btn${activeFormats.has("unorderedList") ? " active" : ""}`}
              title="Bullet List"
              onClick={() => exec("insertUnorderedList")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="9" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="9" y1="18" x2="21" y2="18" />
                <circle
                  cx="4"
                  cy="6"
                  r="1.5"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="4"
                  cy="12"
                  r="1.5"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="4"
                  cy="18"
                  r="1.5"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </button>
            <button
              type="button"
              className="tb-btn"
              title="Indent"
              onClick={() => exec("indent")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="11" y1="12" x2="21" y2="12" />
                <line x1="11" y1="18" x2="21" y2="18" />
                <polyline points="7,9 11,12 7,15" />
              </svg>
            </button>
            <button
              type="button"
              className="tb-btn"
              title="Outdent"
              onClick={() => exec("outdent")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="11" y1="12" x2="21" y2="12" />
                <line x1="11" y1="18" x2="21" y2="18" />
                <polyline points="11,9 7,12 11,15" />
              </svg>
            </button>
          </div>

          {/* Blockquote / Code block */}
          <div className="toolbar-group">
            <button
              type="button"
              className="tb-btn"
              title="Blockquote"
              onClick={() => exec("formatBlock", "blockquote")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
              </svg>
            </button>
            <button
              type="button"
              className="tb-btn"
              title="Code Block"
              onClick={() => exec("formatBlock", "pre")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="16,18 22,12 16,6" />
                <polyline points="8,6 2,12 8,18" />
              </svg>
            </button>
          </div>

          {/* RTL */}
          <div className="toolbar-group">
            <button
              type="button"
              className="tb-btn"
              title="Right to Left"
              onClick={() => {
                const el = editorRef.current;
                if (el)
                  el.style.direction =
                    el.style.direction === "rtl" ? "ltr" : "rtl";
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="17,8 21,12 17,16" />
                <line x1="21" y1="12" x2="9" y2="12" />
                <line x1="3" y1="6" x2="15" y2="6" />
                <line x1="3" y1="10" x2="10" y2="10" />
              </svg>
            </button>
          </div>

          {/* Text Color / Background */}
          <div className="toolbar-group" style={{ position: "relative" }}>
            <button
              type="button"
              ref={colorTextRef}
              className="tb-color-btn"
              title="Text Color"
              onMouseDown={(e) => {
                e.preventDefault();
                restoreSelection();
              }}
              onClick={() =>
                setColorPopover((prev) => (prev === "text" ? null : "text"))
              }
            >
              <span style={{ color: activeColor }}>A</span>
              <div
                className="color-swatch"
                style={{ background: activeColor }}
              />
            </button>
            <button
              type="button"
              ref={colorBgRef}
              className="tb-color-btn"
              title="Highlight"
              onMouseDown={(e) => {
                e.preventDefault();
                restoreSelection();
              }}
              onClick={() =>
                setColorPopover((prev) => (prev === "bg" ? null : "bg"))
              }
            >
              <span style={{ fontSize: 12 }}>🖍</span>
              <div
                className="color-swatch"
                style={{
                  background: activeBg === "transparent" ? "#ddd" : activeBg,
                }}
              />
            </button>
            {colorPopover && (
              <div className="color-popover" ref={popoverRef}>
                <div className="color-popover-label">
                  {colorPopover === "text" ? "Text Color" : "Highlight"}
                </div>
                <div className="color-grid">
                  {PALETTE.map((c) => (
                    <div
                      key={c}
                      className="color-dot"
                      style={{
                        background: c,
                        outline: c === "#ffffff" ? "1px solid #ccc" : "none",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        restoreSelection();
                      }}
                      onClick={() => applyColor(c, colorPopover)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link / Image / Video */}
          <div className="toolbar-group">
            <button
              type="button"
              className="tb-btn"
              title="Insert Link"
              onMouseDown={(e) => {
                e.preventDefault();
                restoreSelection();
              }}
              onClick={insertLink}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            {/* <button
              type="button"
              className="tb-btn"
              title="Insert Image"
              onClick={insertImage}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </button> */}
            {/* <button
              type="button"
              className="tb-btn"
              title="Insert Video"
              onClick={insertVideo}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polygon points="23,7 16,12 23,17" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button> */}
          </div>

          {/* Table */}
          <div className="toolbar-group">
            <button
              type="button"
              className="tb-btn"
              title="Insert Table"
              onClick={insertTable}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          </div>

          {/* Clean */}
          <div className="toolbar-group">
            <button
              type="button"
              className="tb-btn"
              title="Clear Formatting"
              onClick={() => exec("removeFormat")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 7h16" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                <path d="M9 7V4h6v3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="editor-body">
        {/* Sidebar */}
        {/* <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Text Styles</div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-label">Predefined Classes</div>
            <div className="style-grid">
              {sidebarStyles.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  data-style={s.key}
                  className="style-btn"
                  onClick={() => applyClass(s.cls)}
                >
                  <span className="style-btn-label">{s.label}</span>
                  <span className="style-btn-preview">{s.preview}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="doc-stats">
            <div className="sidebar-section-label" style={{ marginBottom: 8 }}>
              Document
            </div>
            <div className="stat-row">
              <span className="stat-label">Words</span>
              <span className="stat-value">{stats.words}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Characters</span>
              <span className="stat-value">{stats.chars}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Blocks</span>
              <span className="stat-value">{stats.lines}</span>
            </div>
          </div>
        </aside> */}

        {/* Canvas */}
        <main className="editor-canvas">
          <div className="editor-page">
            {/* <span className="page-label">Page 1</span> */}
            <div
              ref={editorRef}
              className="editor-content"
              contentEditable
              suppressContentEditableWarning
              data-placeholder={placeholder}
              onInput={() => {
                const el = editorRef.current;
                el.dataset.empty =
                  el.innerText.trim() === "" ? "true" : "false";
                updateStats();
                if (isProgrammaticSyncRef.current) return;
                emitChange();
              }}
              onKeyUp={() => {
                detectFormats();
                saveSelection();
              }}
              onMouseUp={() => {
                detectFormats();
                saveSelection();
              }}
              onFocus={() => {
                detectFormats();
                saveSelection();
              }}
              spellCheck
            />
          </div>
        </main>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        {/* <div className="status-item">
          <div className="status-dot" />
          {savedAt ? `Saved at ${savedAt}` : "Auto-save on"}
        </div> */}
        {/* <span className="status-sep">·</span> */}
        <div className="status-item">{stats.words} words</div>
        <span className="status-sep">·</span>
        <div className="status-item">{stats.chars} characters</div>
      </div>
    </div>
  );
}
