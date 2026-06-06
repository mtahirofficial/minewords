export function analyzeLanguage(text) {
  const urduChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = urduChars + latinChars;

  if (totalChars === 0)
    return { primary: "en", mixed: false, ratio: { ur: 0, en: 1 } };

  const urduRatio = urduChars / totalChars;
  const latinRatio = latinChars / totalChars;

  // Thresholds
  const isMixed = urduRatio > 0.15 && latinRatio > 0.15;

  const primary = urduRatio >= latinRatio ? "ur" : "en";

  const toReturn = {
    primaryLang: primary, // dominant language
    isMixed: isMixed, // true if significantly both
    langs: isMixed ? ["ur", "en"] : [primary],
    ratio: {
      ur: Math.round(urduRatio * 100),
      en: Math.round(latinRatio * 100),
    },
  };

  return {
    primaryLang: primary, // dominant language
    isMixed: isMixed, // true if significantly both
    langs: isMixed ? ["ur", "en"] : [primary],
    // ratio: {
    //   ur: Math.round(urduRatio * 100),
    //   en: Math.round(latinRatio * 100),
    // },
  };
}

export function getHreflang(analysis) {
  if (analysis.mixed) {
    // Use primary language but add ur-PK or en-PK for regional specificity
    return analysis.primary === "ur" ? "ur" : "en-PK";
  }
  return analysis.primary;
}
