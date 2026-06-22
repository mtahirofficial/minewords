import Link from "next/link";
import { useRouter } from "next/router";

const MenuList = ({ setIsMenuOpen }) => {
  const router = useRouter();
  const currentPath = router.asPath.split("?")[0];
  const menu = [
    { label: "Home", url: "/" },
    { label: "Posts", url: "/blog" },
    { label: "Business", url: "/categories/business" },
    { label: "Interview", url: "/categories/interview" },
    { label: "Politics", url: "/categories/politics" },
    { label: "Travel", url: "/categories/travel" },
    { label: "Author list", url: "/about" },
    { label: "Pricing", url: "/contact" },
    { label: "Latest", url: "/blog" },
    { label: "Newsletter", url: "/#newsletter" },
  ];

  const isActivePath = (url) => {
    if (url === "/") return currentPath === "/";
    if (url === "/blog")
      return currentPath === "/blog" || currentPath.startsWith("/blog/");
    if (url === "/#newsletter") return currentPath === "/#newsletter";
    return currentPath === url || currentPath.startsWith(`${url}/`);
  };

  return menu.map((item, i) => (
    <Link
      key={i}
      href={item.url}
      className={`menu-link${isActivePath(item.url) ? " active" : ""}`}
      aria-current={isActivePath(item.url) ? "page" : undefined}
      {...(setIsMenuOpen && { onClick: () => setIsMenuOpen(false) })}
    >
      {item.label}
    </Link>
  ));
};

export default MenuList;
