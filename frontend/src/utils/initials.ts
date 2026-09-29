export function getInitials(name?: string): string {
  const parts = name?.split(' ').filter(Boolean) ?? [];
  if (!parts.length) return 'U';
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
