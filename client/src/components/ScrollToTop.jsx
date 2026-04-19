import { useEffect } from "react";
import { useRouter } from "next/router";

const ScrollToTop = () => {
    const router = useRouter();
    const pathname = router.asPath.split("?")[0];

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [pathname]);

    return null;
};

export default ScrollToTop;

