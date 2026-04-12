export const normalizeItemName = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\+\d+\s*/i, "") // quita +8, +10, etc. al inicio
    .replace(/['`´]/g, "") // quita apóstrofes
    .replace(/[^a-zA-Z0-9\s]/g, " ") // reemplaza símbolos por espacio
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};
