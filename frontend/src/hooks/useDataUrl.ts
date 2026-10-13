import { useEffect, useState } from 'react';

type Loaded = { blob: Blob; url: string };

// The same blob is often shown by several avatars; reading it once avoids a flash of
// initials every time one of them mounts.
const readUrls = new WeakMap<Blob, string>();

export function useDataUrl(blob: Blob | null): string | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!blob || readUrls.has(blob)) return undefined;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      readUrls.set(blob, url);
      setLoaded({ blob, url });
    };
    reader.readAsDataURL(blob);
    return () => {
      reader.onload = null;
      reader.abort();
    };
  }, [blob]);

  if (!blob) return null;
  return readUrls.get(blob) ?? (loaded?.blob === blob ? loaded.url : null);
}
