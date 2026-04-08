import { cleanText } from "./cleanText";

export const normalizeMaybeText = (value: string | null) => {
  if (!value) return null;
  const cleaned = cleanText(value)
    .replace(/^[•.:]+/, "")
    .trim();

  if (!cleaned) return null;

  // casos tipo "...................................."
  if (/^[.\-•~\s]+$/.test(cleaned)) return null;

  return cleaned;
};
