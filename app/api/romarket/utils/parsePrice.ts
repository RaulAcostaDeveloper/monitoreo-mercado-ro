export const parsePrice = (text: string) => {
  const n = Number(text.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
};
