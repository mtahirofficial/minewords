import Link from "next/link";
import { useRouter } from "next/router";
import { useMain } from "../context/MainContext";

const MenuList = ({ setIsMenuOpen }) => {
  const router = useRouter();
  const currentPath = router.asPath.split("?")[0];
  const { categoryStats } = useMain();

  const menu = [
    { label: "Home", url: "/" },
    ...categoryStats.map((category) => ({
      label: category.name,
      url: `/categories/${category.slug}`,
    })),
    { label: "Author list", url: "/about" },
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
