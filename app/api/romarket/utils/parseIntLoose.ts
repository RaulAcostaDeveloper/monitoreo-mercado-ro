export const parseIntLoose = (text: string) => {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
};
