// Same palette as the design: each person keeps one colour wherever they appear.
const AVATAR_COLORS = ['#1f2ba6', '#00b8a9', '#00756a', '#4f5be8', '#127c86', '#2d3fe0'];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function matchesName(fullName: string, query: string): boolean {
  return normalize(fullName).includes(normalize(query.trim()));
}
