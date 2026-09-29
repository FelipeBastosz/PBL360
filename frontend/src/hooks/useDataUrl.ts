import { useEffect, useState } from 'react';

type Loaded = { blob: Blob; url: string };

export function useDataUrl(blob: Blob | null): string | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!blob) return undefined;
    const reader = new FileReader();
    reader.onload = () => setLoaded({ blob, url: String(reader.result) });
    reader.readAsDataURL(blob);
    return () => {
      reader.onload = null;
      reader.abort();
    };
  }, [blob]);

  return blob && loaded?.blob === blob ? loaded.url : null;
}
