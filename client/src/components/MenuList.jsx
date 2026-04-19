import menu from "../menu.json";
import Link from "next/link";
import { useRouter } from "next/router";

const MenuList = ({ setIsMenuOpen }) => {
    const router = useRouter();
    const currentPath = router.asPath.split("?")[0];

    const isActivePath = (url) => {
        if (url === "/") return currentPath === "/";
        return currentPath === url || currentPath.startsWith(`${url}/`);
    };

    return menu.map(
        (item, i) => (
            <Link
                key={i}
                href={item.url}
                className={`menu-link${isActivePath(item.url) ? " active" : ""}`}
                {...(setIsMenuOpen && { onClick: () => setIsMenuOpen(false) })}
            >
                {item.label}
            </Link>
        )
    );
}

export default MenuList;
