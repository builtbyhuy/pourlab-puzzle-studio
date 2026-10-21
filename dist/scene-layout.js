/** Responsive bottle positions only. This module has no DOM, WebGL or game state. */
export function arrangeBottles(count, width, viewportHeight = 800) {
  if (!Number.isInteger(count) || count < 2 || count > 12) throw new RangeError('Use 2–12 bottles.');
  const narrow = width < 560;
  const columns = Math.min(count, narrow ? (count <= 5 ? count : 3) : width < 900 ? 5 : 6);
  const rows = Math.ceil(count / columns);
  const spacing = narrow && rows === 1 ? 1.05 : narrow ? 1.3 : 1.65;
  const rowDepth = 4.3;
  const height = rows === 1 ? narrow ? 265 : Math.round(Math.min(320, Math.max(220, viewportHeight * .31))) : rows * (narrow ? 174 : 205) + 35;
  const positions = Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    const inRow = Math.min(columns, count - row * columns);
    return { x: (column - (inRow - 1) / 2) * spacing, y: 0, z: (row - (rows - 1) / 2) * rowDepth, row, column };
  });
  return { count, columns, rows, spacing, rowDepth, height, narrow, positions };
}
