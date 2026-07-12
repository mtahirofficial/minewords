import socialLinks from "../socials.json";
import { slugifyText } from "../helper";

const siteSocialLinks = socialLinks.map((item) => ({
  label: item.name,
  href: item.url,
}));

const buildAvatarDataUri = (name = "", bg = "#173f6d", fg = "#ffffff") => {
  const initials = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MW";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-label="${name}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="640" height="640" rx="96" fill="url(#bg)" />
      <circle cx="320" cy="245" r="108" fill="rgba(255,255,255,0.14)" />
      <path d="M160 538c26-88 94-132 160-132s134 44 160 132" fill="rgba(255,255,255,0.16)" />
      <text x="50%" y="56%" fill="${fg}" text-anchor="middle" font-family="Arial, sans-serif" font-size="150" font-weight="700" letter-spacing="6">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const authorProfiles = {
  "alex-johnson": {
    slug: "alex-johnson",
    name: "Alex Johnson",
    role: "Contributing Writer",
    since: "2025",
    bio:
      "Alex writes practical guides about web development, performance, and the tools teams use to ship modern products. The focus is always on clear takeaways and implementation-ready advice.",
    credentials: [
      "Publishes on MineWords since 2025",
      "Covers frontend engineering, web performance, and AI-assisted workflows",
      "Specializes in turning technical topics into step-by-step tutorials",
    ],
    topics: ["Web Development", "Performance", "AI Workflows"],
    avatarUrl: "/authors/alex-johnson.svg",
    avatarAlt: "Alex Johnson editorial portrait",
    socialLinks: [
      ...siteSocialLinks,
      { label: "Contact editorial desk", href: "/contact" },
    ],
  },
  "emma-rodriguez": {
    slug: "emma-rodriguez",
    name: "Emma Rodriguez",
    role: "Contributing Writer",
    since: "2025",
    bio:
      "Emma focuses on React patterns, component architecture, and frontend education. Her articles aim to make advanced frontend ideas approachable for builders at every level.",
    credentials: [
      "Publishes on MineWords since 2025",
      "Writes about React, hooks, and scalable UI architecture",
      "Known for teaching complex frontend ideas with practical examples",
    ],
    topics: ["React", "Frontend Architecture", "UI Systems"],
    avatarUrl: "/authors/emma-rodriguez.svg",
    avatarAlt: "Emma Rodriguez editorial portrait",
    socialLinks: [
      ...siteSocialLinks,
      { label: "Contact editorial desk", href: "/contact" },
    ],
  },
  "jamal-washington": {
    slug: "jamal-washington",
    name: "Jamal Washington",
    role: "Contributing Writer",
    since: "2025",
    bio:
      "Jamal writes about accessibility, inclusive product design, and the small implementation details that make digital experiences work for more people.",
    credentials: [
      "Publishes on MineWords since 2025",
      "Focuses on accessibility, semantic HTML, and inclusive UX",
      "Advocates for practical WCAG-aligned implementation",
    ],
    topics: ["Accessibility", "Inclusive Design", "Semantic HTML"],
    avatarUrl: "/authors/jamal-washington.svg",
    avatarAlt: "Jamal Washington editorial portrait",
    socialLinks: [
      ...siteSocialLinks,
      { label: "Contact editorial desk", href: "/contact" },
    ],
  },
};

const buildFallbackProfile = (name = "") => {
  const normalizedName = String(name || "").trim() || "MineWords Contributor";
  const slug = slugifyText(normalizedName, "author");

  return {
    slug,
    name: normalizedName,
    role: "Contributing Writer",
    since: "2025",
    bio:
      "This contributor writes for MineWords across practical how-to guides, stories, and editorial explainers.",
    credentials: [
      "Publishes on MineWords",
      "Focuses on useful, research-backed explainers",
      "Part of the MineWords editorial contributor network",
    ],
    topics: ["Editorial", "Guides", "Stories"],
    avatarUrl: buildAvatarDataUri(normalizedName, "#334155"),
    avatarAlt: `${normalizedName} editorial portrait`,
    socialLinks: [
      ...siteSocialLinks,
      { label: "Contact editorial desk", href: "/contact" },
    ],
  };
};

export const getAuthorProfile = (slugOrName = "") => {
  const slug = slugifyText(slugOrName, "author");
  return authorProfiles[slug] || buildFallbackProfile(slugOrName);
};

export const getAuthorProfiles = () => Object.values(authorProfiles);

export const getAuthorSlug = (name = "") => slugifyText(name, "author");
