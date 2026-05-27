import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import {
  fetchBlogCategories,
  fetchHashtagSuggestions,
  withFreeHashtagSuggestion,
} from "../helper";
import { showToast } from "../toast";
import { resolveStaticFileUrl } from "../utils/staticUrl";
import Editor from "./editor";

const containsHtmlTag = (value = "") => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const plainTextToHtml = (value = "") => {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return "<p><br></p>";
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
};

const normalizeContentToHtml = (value = "") => {
  if (!value || !value.trim()) return "<p><br></p>";
  return containsHtmlTag(value) ? value : plainTextToHtml(value);
};

const htmlToPlainText = (html = "") =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const MAX_TAGS = 10;
const VALID_SLUG_RE = /^[\u0600-\u06FFa-z0-9]+(?:-[\u0600-\u06FFa-z0-9]+)*$/;

const slugify = (value = "", fallback = "") =>
  String(value || fallback)
    .toLowerCase()
    .trim()
    // keep Urdu + English letters/numbers
    .replace(/[^\u0600-\u06FFa-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeTag = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

const parseInitialTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((tag) => normalizeTag(tag)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => normalizeTag(tag))
      .filter(Boolean);
  }

  return [];
};

const BlogEditorForm = ({
  pageTitle,
  pageSubtitle,
  submitLabel,
  draftLabel = "Save Draft",
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    ...initialValues,
    content: normalizeContentToHtml(initialValues.content),
    slug: initialValues.slug || "",
    status: initialValues.status || "published",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [tags, setTags] = useState(parseInitialTags(initialValues.tags));
  const [tagInput, setTagInput] = useState("");
  const titleRef = useRef(null);
  const excerptRef = useRef(null);

  const [showCategoryList, setShowCategoryList] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [showHashtagList, setShowHashtagList] = useState(false);
  const [activeHashtagQuery, setActiveHashtagQuery] = useState("");
  const [activeHashtagField, setActiveHashtagField] = useState(null);
  const activeHashtagFieldRef = useRef(null);
  const hashtagDebounceRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const slugCheckTimerRef = useRef(null);
  const autosaveLastSnapshotRef = useRef("");
  const [slugState, setSlugState] = useState({
    value: initialValues.slug || "",
    normalized: initialValues.slug ? slugify(initialValues.slug) : "",
    checking: false,
    available: null,
    message: "",
  });
  const [autosaveState, setAutosaveState] = useState({
    enabled: true,
    saving: false,
    lastSavedAt: null,
    error: "",
  });

  const hideHashtagSuggestions = (delay = 0) => {
    const close = () => {
      setShowHashtagList(false);
      setHashtagSuggestions([]);
      setActiveHashtagQuery("");
      setActiveHashtagField(null);
    };

    if (!delay) {
      close();
      return;
    }
    setTimeout(close, delay);
  };

  useEffect(() => {
    activeHashtagFieldRef.current = activeHashtagField;
  }, [activeHashtagField]);

  useEffect(() => {
    setFormData({
      ...initialValues,
      content: normalizeContentToHtml(initialValues.content),
      slug: initialValues.slug || "",
      status: initialValues.status || "published",
    });
    setTags(parseInitialTags(initialValues.tags));
    setTagInput("");

    const existingCover = String(initialValues.coverImage || "").trim();
    if (existingCover) {
      const resolved = resolveStaticFileUrl(
        existingCover,
        process.env.VITE_API_URL || api.defaults.baseURL,
      );
      setCoverImage(null);
      setCoverImagePreview(resolved);
    } else {
      setCoverImage(null);
      setCoverImagePreview("");
    }

    setSlugState({
      value: initialValues.slug || "",
      normalized: initialValues.slug ? slugify(initialValues.slug) : "",
      checking: false,
      available: null,
      message: "",
    });
  }, [initialValues]);

  const validateSlugLocal = (normalized = "") => {
    const value = String(normalized || "").trim();
    if (!value) {
      return { ok: true, message: "" };
    }
    if (value.length < 3) {
      return { ok: false, message: "Slug must be at least 3 characters" };
    }
    if (value.length > 120) {
      return { ok: false, message: "Slug must be 120 characters or less" };
    }
    if (!VALID_SLUG_RE.test(value)) {
      return {
        ok: false,
        message: "Slug may contain letters, numbers, and '-'",
      };
    }
    return { ok: true, message: "" };
  };

  const checkSlugAvailability = (normalized) => {
    const localValidation = validateSlugLocal(normalized);
    if (!localValidation.ok) {
      setSlugState((prev) => ({
        ...prev,
        normalized,
        checking: false,
        available: false,
        message: localValidation.message,
      }));
      return;
    }

    setSlugState((prev) => ({
      ...prev,
      normalized,
      checking: true,
      message: "Checking availability...",
      available: null,
    }));

    if (slugCheckTimerRef.current) {
      clearTimeout(slugCheckTimerRef.current);
    }

    slugCheckTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/blogs/validate-slug", {
          params: {
            slug: normalized,
            excludeId: initialValues?.id || "",
          },
        });
        const available = Boolean(res?.data?.available);
        setSlugState((prev) => ({
          ...prev,
          checking: false,
          available,
          message: available ? "Slug is available" : "Slug is already taken",
        }));
      } catch (_error) {
        setSlugState((prev) => ({
          ...prev,
          checking: false,
          available: null,
          message: "Unable to validate slug right now",
        }));
      }
    }, 450);
  };

  const handleSlugChange = (e) => {
    const raw = e.target.value || "";
    const normalized = slugify(raw);

    setFormData((prev) => ({
      ...prev,
      slug: normalized,
    }));

    setSlugState((prev) => ({
      ...prev,
      value: raw,
      normalized,
    }));

    if (!normalized) {
      setSlugState((prev) => ({
        ...prev,
        checking: false,
        available: null,
        message: "",
      }));
      return;
    }

    checkSlugAvailability(normalized);
  };

  const submitWithIntent = async (intent = "publish", options = {}) => {
    const { requireContent = false } = options || {};
    if (isSubmitting) return;

    const normalizedSlug = slugify(formData.slug || "");
    const slugValidation = validateSlugLocal(normalizedSlug);
    if (!slugValidation.ok) {
      showToast(slugValidation.message, "error");
      return;
    }
    if (normalizedSlug && slugState.available === false) {
      showToast("Slug is already taken", "error");
      return;
    }

    const plainTextContent = htmlToPlainText(formData.content);
    if (requireContent && !plainTextContent) {
      showToast("Article content is required.", "error");
      return;
    }

    let finalTags = tags;
    const pendingTag = normalizeTag(tagInput);
    if (pendingTag) {
      const tagSet = new Set(tags.map((item) => item.toLowerCase()));
      if (!tagSet.has(pendingTag) && tags.length < MAX_TAGS) {
        finalTags = [...tags, pendingTag];
        setTags(finalTags);
      }
      setTagInput("");
    }

    const payload = {
      ...formData,
      slug: normalizedSlug,
      status:
        intent === "draft"
          ? "draft"
          : intent === "publish"
            ? "published"
            : formData.status || "draft",
      tags: finalTags,
      coverImage,
      coverImagePreview,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload, { intent });
      if (intent === "draft") {
        showToast("Draft saved", "success");
      } else if (intent === "autosave") {
        setAutosaveState((prev) => ({
          ...prev,
          saving: false,
          lastSavedAt: Date.now(),
          error: "",
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!autosaveState.enabled) return;
    if (!onSubmit) return;

    const snapshot = JSON.stringify({
      title: formData.title || "",
      excerpt: formData.excerpt || "",
      content: formData.content || "",
      author: formData.author || "",
      category: formData.category || "",
      slug: formData.slug || "",
      tags,
    });

    // Avoid autosaving before the user types anything meaningful.
    const hasMeaningfulContent =
      String(formData.title || "").trim() ||
      String(formData.excerpt || "").trim() ||
      htmlToPlainText(formData.content || "").length > 30;

    if (!hasMeaningfulContent) {
      autosaveLastSnapshotRef.current = snapshot;
      return;
    }

    if (autosaveLastSnapshotRef.current === snapshot) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      autosaveLastSnapshotRef.current = snapshot;
      setAutosaveState((prev) => ({ ...prev, saving: true, error: "" }));
      try {
        await submitWithIntent("autosave");
      } catch (_error) {
        setAutosaveState((prev) => ({
          ...prev,
          saving: false,
          error: "Autosave failed",
        }));
      }
    }, 20000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, tags, autosaveState.enabled]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current);
      if (hashtagDebounceRef.current) clearTimeout(hashtagDebounceRef.current);
    };
  }, []);

  useEffect(
    () => () => {
      if (hashtagDebounceRef.current) {
        clearTimeout(hashtagDebounceRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await fetchBlogCategories();
        const merged = [
          ...new Set(
            [...fetchedCategories, initialValues.category].filter(Boolean),
          ),
        ];
        setCategories(merged);
        setFilteredCategories(merged);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };

    loadCategories();
  }, [initialValues.category]);

  const fetchHashtagList = (query = "") => {
    if (hashtagDebounceRef.current) {
      clearTimeout(hashtagDebounceRef.current);
    }

    hashtagDebounceRef.current = setTimeout(async () => {
      try {
        const items = await fetchHashtagSuggestions(query);
        setHashtagSuggestions(withFreeHashtagSuggestion(items, query));
      } catch (error) {
        console.error("Failed to fetch hashtag suggestions", error);
        setHashtagSuggestions([]);
      }
    }, 180);
  };

  const detectHashtagInText = ({ value = "", cursor = 0, field = null }) => {
    const safeCursor = Math.max(0, Number(cursor || 0));
    const textBeforeCursor = String(value).slice(0, safeCursor);
    const match = textBeforeCursor.match(/(?:^|\s)#([A-Za-z0-9_]*)$/);

    if (!match) {
      if (activeHashtagFieldRef.current === field) hideHashtagSuggestions();
      return;
    }

    const query = match[1] || "";
    setActiveHashtagQuery(query);
    setActiveHashtagField(field);
    setShowHashtagList(true);
    fetchHashtagList(query);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTitleChange = (e) => {
    const { value, selectionStart } = e.target;
    setFormData((prev) => ({ ...prev, title: value }));
    detectHashtagInText({ value, cursor: selectionStart, field: "title" });
  };

  const handleTitleCursorCheck = (e) => {
    detectHashtagInText({
      value: e.target.value,
      cursor: e.target.selectionStart,
      field: "title",
    });
  };

  const handleExcerptChange = (e) => {
    const { value, selectionStart } = e.target;
    setFormData((prev) => ({ ...prev, excerpt: value }));
    detectHashtagInText({ value, cursor: selectionStart, field: "excerpt" });
  };

  const handleExcerptCursorCheck = (e) => {
    detectHashtagInText({
      value: e.target.value,
      cursor: e.target.selectionStart,
      field: "excerpt",
    });
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const maxSizeInBytes = 5 * 1024 * 1024;

    if (!isImage) {
      showToast("Please upload a valid image file.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > maxSizeInBytes) {
      showToast("Image must be 5MB or less.", "error");
      e.target.value = "";
      return;
    }

    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview("");
  };

  const addTags = (rawTags = []) => {
    const incoming = rawTags.map((tag) => normalizeTag(tag)).filter(Boolean);
    if (!incoming.length) return;

    setTags((prev) => {
      const existing = new Set(prev.map((tag) => tag.toLowerCase()));
      const next = [...prev];
      let blockedByLimit = false;

      for (const item of incoming) {
        const key = item.toLowerCase();
        if (existing.has(key)) continue;
        if (next.length >= MAX_TAGS) {
          blockedByLimit = true;
          break;
        }
        next.push(item);
        existing.add(key);
      }

      if (blockedByLimit) {
        showToast(`You can add up to ${MAX_TAGS} tags only.`, "error");
      }

      return next;
    });
  };

  const commitTagInput = () => {
    const next = normalizeTag(tagInput);
    if (!next) {
      setTagInput("");
      return;
    }
    addTags([next]);
    setTagInput("");
  };

  const handleTagInputChange = (e) => {
    const nextValue = e.target.value || "";
    if (!nextValue.includes(",")) {
      setTagInput(nextValue);
      return;
    }

    const parts = nextValue.split(",");
    const completeTags = parts.slice(0, -1);
    const remainder = parts[parts.length - 1] || "";
    addTags(completeTags);
    setTagInput(remainder);
  };

  const handleTagInputPaste = (e) => {
    const pastedText = e.clipboardData?.getData("text") || "";
    if (!pastedText.includes(",")) return;

    e.preventDefault();
    const parsedTags = pastedText.split(",");
    addTags(parsedTags);
    setTagInput("");
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      commitTagInput();
      return;
    }

    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const plainTextContent = useMemo(
    () => htmlToPlainText(formData.content),
    [formData.content],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitWithIntent("publish", { requireContent: true });
  };

  const contentWordCount = plainTextContent
    ? plainTextContent.split(/\s+/).length
    : 0;
  const estimatedReadMinutes = Math.max(1, Math.ceil(contentWordCount / 200));

  const handleSelectHashtag = (tagName = "") => {
    if (activeHashtagField === "title" || activeHashtagField === "excerpt") {
      const isTitle = activeHashtagField === "title";
      const input = isTitle ? titleRef.current : excerptRef.current;
      if (!input) return;

      const cursor = input.selectionStart || 0;
      const fieldValue = isTitle ? formData.title : formData.excerpt;
      const textBeforeCursor = fieldValue.slice(0, cursor);
      const match = textBeforeCursor.match(/(?:^|\s)#([A-Za-z0-9_]*)$/);
      if (!match) return;

      const matchedText = match[0];
      const startsWithSpace = matchedText.startsWith(" ");
      const replaceStart =
        cursor - matchedText.length + (startsWithSpace ? 1 : 0);
      const nextValue =
        fieldValue.slice(0, replaceStart) +
        `#${tagName} ` +
        fieldValue.slice(cursor);
      const nextCursor = replaceStart + tagName.length + 2;

      setFormData((prev) => ({
        ...prev,
        [isTitle ? "title" : "excerpt"]: nextValue,
      }));
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(nextCursor, nextCursor);
      });
    }

    hideHashtagSuggestions();
  };

  return (
    <main className="container compose-blog-page">
      <section className="compose-blog-hero">
        <p className="compose-blog-kicker">Content Studio</p>
        <h1>{pageTitle}</h1>
        <p className="compose-blog-subtitle">{pageSubtitle}</p>
      </section>

      <div className="compose-blog-layout">
        <div className="compose-blog-main">
          <form onSubmit={handleSubmit} className="compose-blog-form">
            <div className="compose-form-row">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  ref={titleRef}
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  onKeyUp={handleTitleCursorCheck}
                  onClick={handleTitleCursorCheck}
                  onFocus={handleTitleCursorCheck}
                  onBlur={() => {
                    if (activeHashtagField === "title")
                      hideHashtagSuggestions(120);
                  }}
                  placeholder="Enter a concise, compelling headline"
                  required
                />
                {showHashtagList && activeHashtagField === "title" && (
                  <div className="hashtag-suggestions">
                    {hashtagSuggestions.length > 0 ? (
                      <ul>
                        {hashtagSuggestions.map((tag) => (
                          <li
                            key={`${tag.name}-title`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectHashtag(tag.name);
                            }}
                          >
                            #{tag.name}
                            <span>{tag.count || 0}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="hashtag-suggestions-empty">
                        Type to search hashtag
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className="form-group compose-category-field"
                style={{ position: "relative" }}
              >
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    handleInputChange(e);
                    const input = e.target.value.toLowerCase();
                    const filtered = categories.filter((cat) =>
                      cat.toLowerCase().includes(input),
                    );
                    setFilteredCategories(filtered);
                    setShowCategoryList(true);
                  }}
                  placeholder="e.g. Technology, Design, Lifestyle"
                  autoComplete="off"
                  required
                  onFocus={() => {
                    setFilteredCategories(categories);
                    setShowCategoryList(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowCategoryList(false), 100)
                  }
                />
                {showCategoryList && filteredCategories.length > 0 && (
                  <ul className="category-suggestions">
                    {filteredCategories.map((cat, i) => (
                      <li
                        key={i}
                        onMouseDown={() => {
                          setFormData((prev) => ({ ...prev, category: cat }));
                          setShowCategoryList(false);
                        }}
                      >
                        {cat}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="excerpt">Excerpt</label>
              <textarea
                ref={excerptRef}
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleExcerptChange}
                onKeyUp={handleExcerptCursorCheck}
                onClick={handleExcerptCursorCheck}
                onFocus={handleExcerptCursorCheck}
                onBlur={() => {
                  if (activeHashtagField === "excerpt")
                    hideHashtagSuggestions(120);
                }}
                placeholder="Add a short summary that appears in listings and previews"
                rows={4}
                minLength={200}
                maxLength={350}
                required
              />
              {showHashtagList && activeHashtagField === "excerpt" && (
                <div className="hashtag-suggestions">
                  {hashtagSuggestions.length > 0 ? (
                    <ul>
                      {hashtagSuggestions.map((tag) => (
                        <li
                          key={`${tag.name}-excerpt`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectHashtag(tag.name);
                          }}
                        >
                          #{tag.name}
                          <span>{tag.count || 0}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="hashtag-suggestions-empty">
                      {activeHashtagQuery
                        ? "No hashtag found"
                        : "Type to search hashtag"}
                    </div>
                  )}
                </div>
              )}
              <small>Recommended: 200 to 350 characters.</small>
            </div>
            <div className="form-group">
              <div className="compose-editor compose-editor-library">
                <div className="compose-editor-head">
                  <span className="compose-editor-title">Article Content</span>
                  <small>
                    Tip: Highlight text, then apply formatting from the toolbar.
                  </small>
                </div>
                <Editor
                  value={formData.content}
                  onChange={(html) => {
                    setFormData((prev) => ({
                      ...prev,
                      content: normalizeContentToHtml(html),
                    }));
                  }}
                  placeholder="Write your article here..."
                />
              </div>
              {/* <small>
                Tip: Highlight text, then apply formatting from the toolbar.
              </small> */}
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                onPaste={handleTagInputPaste}
                onBlur={commitTagInput}
                placeholder="Type a tag and press comma (,) to add"
                disabled={tags.length >= MAX_TAGS}
              />
              <small>
                Add up to {MAX_TAGS} tags. Comma creates a tag. Paste
                comma-separated values to add many at once.
              </small>
              {tags.length > 0 && (
                <div className="compose-tags-list">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="compose-tag-chip"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      {tag}
                      <span aria-hidden="true">x</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="slug">Slug</label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug || ""}
                onChange={handleSlugChange}
                placeholder="e.g. my-first-blog-post"
                autoComplete="off"
                required
              />
              {slugState.message ?? (
                <small
                  style={{
                    color:
                      slugState.available === false
                        ? "var(--danger, #dc3545)"
                        : slugState.available === true
                          ? "var(--success, #198754)"
                          : "inherit",
                  }}
                >
                  {slugState.message}
                </small>
              )}
            </div>

            <div className="compose-form-row">
              <div className="form-group">
                <label htmlFor="author">Author</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="coverImage">Cover Image</label>
                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="compose-file-input"
                />
                <small>Accepted formats: JPG, PNG, WEBP. Max size 5MB.</small>
              </div>
            </div>

            {coverImagePreview && (
              <div className="compose-image-preview">
                <img src={coverImagePreview} alt="Cover preview" />
                <div className="compose-image-meta">
                  <p>{coverImage?.name}</p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={removeCoverImage}
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}

            <div className="form-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => submitWithIntent("draft")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : draftLabel}
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : submitLabel}
              </button>
            </div>
            {(autosaveState.saving ||
              autosaveState.lastSavedAt ||
              autosaveState.error) && (
              <div style={{ marginTop: "10px" }}>
                <small>
                  {autosaveState.saving
                    ? "Autosaving..."
                    : autosaveState.error
                      ? autosaveState.error
                      : autosaveState.lastSavedAt
                        ? `Autosaved at ${new Date(
                            autosaveState.lastSavedAt,
                          ).toLocaleTimeString()}`
                        : ""}
                </small>
              </div>
            )}
          </form>
        </div>

        <aside className="compose-blog-aside">
          <div className="compose-aside-card">
            <h3>Post Summary</h3>
            <div className="compose-stat">
              <span>Words</span>
              <strong>{contentWordCount}</strong>
            </div>
            <div className="compose-stat">
              <span>Read Time</span>
              <strong>{estimatedReadMinutes} min</strong>
            </div>
            <div className="compose-stat">
              <span>Category</span>
              <strong>{formData.category || "Not selected"}</strong>
            </div>
          </div>

          <div className="compose-aside-card">
            <h3>Publishing Tips</h3>
            <ul>
              <li>Use a clear title with one main idea.</li>
              <li>Start with a short, useful excerpt.</li>
              <li>Break long sections into short paragraphs.</li>
              <li>Add a cover image for stronger engagement.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default BlogEditorForm;
