export function getNextGridIndex(
  key: string,
  index: number,
  total: number,
  columns: number,
): number | null {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % total;
    case 'ArrowLeft':
      return (index - 1 + total) % total;
    case 'ArrowDown':
      return (index + columns) % total;
    case 'ArrowUp':
      return (index - columns + total) % total;
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return null;
  }
}
