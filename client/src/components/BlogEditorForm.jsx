import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBlogCategories,
  fetchHashtagSuggestions,
  withFreeHashtagSuggestion,
} from "../helper";
import { showToast } from "../toast";

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
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    ...initialValues,
    content: normalizeContentToHtml(initialValues.content),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [tags, setTags] = useState(parseInitialTags(initialValues.tags));
  const [tagInput, setTagInput] = useState("");
  const quillHostRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const titleRef = useRef(null);
  const excerptRef = useRef(null);
  const isProgrammaticSyncRef = useRef(false);

  const [showCategoryList, setShowCategoryList] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [showHashtagList, setShowHashtagList] = useState(false);
  const [activeHashtagQuery, setActiveHashtagQuery] = useState("");
  const [activeHashtagField, setActiveHashtagField] = useState(null);
  const activeHashtagFieldRef = useRef(null);
  const hashtagDebounceRef = useRef(null);
  const isSelectingHashtagRef = useRef(false);

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
    });
    setTags(parseInitialTags(initialValues.tags));
    setTagInput("");
  }, [initialValues]);

  useEffect(() => {
    if (!quillHostRef.current || quillInstanceRef.current) return;

    let cancelled = false;

    const initQuill = async () => {
      if (typeof window === "undefined") return;
      const { default: Quill } = await import("quill");
      if (cancelled || !quillHostRef.current || quillInstanceRef.current)
        return;

      const quill = new Quill(quillHostRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike"],
            [
              { list: "ordered" },
              { list: "bullet" },
              { indent: "-1" },
              { indent: "+1" },
            ],
            ["blockquote", "code-block", "link"],
            ["clean"],
          ],
        },
      });

      quill.root.innerHTML = normalizeContentToHtml(formData.content);
      const detectActiveHashtag = () => {
        const selection = quill.getSelection(true);
        const selectionIndex =
          typeof selection?.index === "number"
            ? selection.index
            : Math.max(0, quill.getLength() - 1);

        const textBeforeCursor = quill.getText(0, selectionIndex);
        const match = textBeforeCursor.match(/(?:^|\s)#([A-Za-z0-9_]*)$/);

        if (!match) {
          if (activeHashtagFieldRef.current === "content")
            hideHashtagSuggestions();
          return null;
        }

        const query = match[1] || "";
        setActiveHashtagQuery(query);
        setShowHashtagList(true);
        setActiveHashtagField("content");
        return query;
      };

      quill.on("text-change", (_delta, _oldDelta, source) => {
        if (source !== "user") return;
        isProgrammaticSyncRef.current = true;
        const nextHtml = quill.root.innerHTML;
        setFormData((prev) => ({ ...prev, content: nextHtml }));
        isProgrammaticSyncRef.current = false;

        const query = detectActiveHashtag();
        if (query === null) return;

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
      });

      quill.on("selection-change", (range) => {
        if (isSelectingHashtagRef.current) return;
        if (!range) {
          if (activeHashtagFieldRef.current === "content")
            hideHashtagSuggestions();
          return;
        }
        detectActiveHashtag();
      });

      quill.root.addEventListener("blur", () => {
        if (activeHashtagFieldRef.current === "content")
          hideHashtagSuggestions(120);
      });

      quillInstanceRef.current = quill;
    };

    initQuill();

    return () => {
      cancelled = true;
    };
  }, [formData.content]);

  useEffect(
    () => () => {
      if (hashtagDebounceRef.current) {
        clearTimeout(hashtagDebounceRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (!quill) return;
    if (isProgrammaticSyncRef.current) return;

    const normalized = normalizeContentToHtml(formData.content);
    if (quill.root.innerHTML !== normalized) {
      quill.root.innerHTML = normalized;
    }
  }, [formData.content]);

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

    if (!plainTextContent) {
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

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        content: formData.content,
        tags: finalTags,
        coverImage,
      });
    } finally {
      setIsSubmitting(false);
    }
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
    } else {
      const quill = quillInstanceRef.current;
      if (!quill) return;

      const range = quill.getSelection(true);
      if (!range) return;

      const textBeforeCursor = quill.getText(0, range.index);
      const match = textBeforeCursor.match(/(?:^|\s)#([A-Za-z0-9_]*)$/);
      if (!match) return;

      const queryLength = (match[1] || "").length;
      const hashStartIndex = range.index - queryLength - 1;
      if (hashStartIndex < 0) return;

      isSelectingHashtagRef.current = true;
      quill.deleteText(hashStartIndex, queryLength + 1, "user");
      quill.insertText(hashStartIndex, `#${tagName} `, "user");
      quill.setSelection(hashStartIndex + tagName.length + 2, 0, "silent");

      setTimeout(() => {
        isSelectingHashtagRef.current = false;
      }, 0);
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
                maxLength={250}
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
              <small>Recommended: 200 to 250 characters.</small>
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
              {/* <label htmlFor="content-editor">Article Content</label> */}
              <div className="compose-editor compose-editor-library">
                <div className="compose-editor-head">
                  <span className="compose-editor-title">Article Content</span>
                  {/* <span className="compose-editor-hint">
                    Library-powered editor with standard formatting tools
                  </span> */}
                  <small>
                    Tip: Highlight text, then apply formatting from the toolbar.
                  </small>
                </div>
                <div ref={quillHostRef} className="compose-quill-host" />
                {showHashtagList && activeHashtagField === "content" && (
                  <div className="hashtag-suggestions">
                    {hashtagSuggestions.length > 0 ? (
                      <ul>
                        {hashtagSuggestions.map((tag) => (
                          <li
                            key={tag.name}
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
              </div>
              {/* <small>
                Tip: Highlight text, then apply formatting from the toolbar.
              </small> */}
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
                type="submit"
                className="btn btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : submitLabel}
              </button>
            </div>
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
