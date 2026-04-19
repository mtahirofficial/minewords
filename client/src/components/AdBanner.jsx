import { useEffect, useMemo, useState } from "react";

const ADSENSE_CLIENT = process.env.VITE_ADSENSE_CLIENT?.trim() || "";

const ensureAdSenseScript = () => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!ADSENSE_CLIENT) return Promise.resolve(false);
  if (window.adsbygoogle && window.__adsenseLoaded) return Promise.resolve(true);
  if (window.__adsenseLoaderPromise) return window.__adsenseLoaderPromise;

  window.__adsenseLoaderPromise = new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );
    if (existing) {
      window.__adsenseLoaded = true;
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.onload = () => {
      window.__adsenseLoaded = true;
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return window.__adsenseLoaderPromise;
};

const AdBanner = ({
  slot = "",
  className = "",
  style = { display: "block" },
  format = "auto",
  responsive = true,
}) => {
  const [ready, setReady] = useState(false);
  const safeSlot = String(slot || "").trim();

  const adStyle = useMemo(() => style || { display: "block" }, [style]);

  useEffect(() => {
    let mounted = true;
    if (!safeSlot || !ADSENSE_CLIENT) return;

    ensureAdSenseScript().then((loaded) => {
      if (!mounted || !loaded) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setReady(true);
      } catch (error) {
        console.error("AdSense ad render failed", error);
      }
    });

    return () => {
      mounted = false;
    };
  }, [safeSlot]);

  if (!safeSlot || !ADSENSE_CLIENT) return null;

  return (
    <div className={`ad-banner ${className}`.trim()} data-ready={ready ? "1" : "0"}>
      <ins
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={safeSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

export default AdBanner;

