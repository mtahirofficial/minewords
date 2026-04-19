import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getSiteOrigin } from "../config/runtime";

const routeLabelMap = {
  about: "About",
  blog: "Blog",
  categories: "Categories",
  contact: "Contact",
  create: "Create",
  dashboard: "Dashboard",
  forgot: "Forgot Password",
  faqs: "FAQs",
  hashtag: "Hashtag",
  login: "Login",
  signup: "Signup",
  "verify-email": "Verify Email",
  edit: "Edit",
};

const normalizePath = (value = "") => {
  const raw = String(value || "").split("?")[0].split("#")[0].trim();
  if (!raw || raw === "/") return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const segmentToLabel = (segment = "", index = 0, allSegments = []) => {
  if (!segment) return "";

  if (allSegments[index - 1] === "hashtag") {
    return `#${decodeURIComponent(segment)}`;
  }

  if (routeLabelMap[segment]) {
    return routeLabelMap[segment];
  }

  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getAbsoluteHref = (siteOrigin = "", href = "") => {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  const normalizedHref = normalizePath(href);
  return `${siteOrigin}${normalizedHref === "/" ? "/" : normalizedHref}`;
};

const Breadcrumb = ({ items = [] }) => {
  const router = useRouter();
  const siteOrigin = getSiteOrigin();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const dynamicItems = useMemo(() => {
    const rawPath = hasHydrated ? router.asPath : router.pathname;
    const currentPath = normalizePath(rawPath || "/");
    const segments = currentPath.split("/").filter(Boolean);
    const generated = [{ label: "Home", href: "/" }];

    segments.forEach((segment, index) => {
      generated.push({
        label: segmentToLabel(segment, index, segments),
        href: `/${segments.slice(0, index + 1).join("/")}`,
      });
    });

    return generated.map((item, index) => ({
      ...item,
      current: index === generated.length - 1,
    }));
  }, [hasHydrated, router.asPath, router.pathname]);

  const resolvedItems = Array.isArray(items) && items.length > 0 ? items : dynamicItems;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: resolvedItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: getAbsoluteHref(siteOrigin, item.href) } : {}),
    })),
  };

  return (
    <>
      <Head>
        <script
          key="ld-breadcrumb"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </Head>

      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <ul className="breadcrumb-list">
          {resolvedItems.map((item, index) => {
            const isCurrent = item.current || index === resolvedItems.length - 1;

            return (
              <li className="breadcrumb-item" key={`${item.label}-${index}`}>
                {item.href && !isCurrent ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span aria-current={isCurrent ? "page" : undefined}>
                    {item.label}
                  </span>
                )}
                {index < resolvedItems.length - 1 && (
                  <span className="breadcrumb-separator" aria-hidden="true">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default Breadcrumb;
