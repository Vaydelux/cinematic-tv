export type ExternalIds = {
  tmdbId?: number;
  imdbId?: string;
  malId?: number;
};

export function resolveExternalIds(
  links?: { site: string; url?: string | null; siteId?: number | null }[]
): ExternalIds {
  const result: ExternalIds = {};
  if (!links?.length) return result;

  for (const link of links) {
    const site = link.site.toLowerCase();
    if (site.includes('themoviedb') || site === 'tmdb') {
      const id = link.siteId ?? extractIdFromUrl(link.url, /movie\/(\d+)|tv\/(\d+)/);
      if (id) result.tmdbId = id;
    }
    if (site === 'imdb') {
      const match = link.url?.match(/tt\d+/);
      if (match) result.imdbId = match[0];
    }
    if (site.includes('myanimelist') || site === 'mal') {
      const id = link.siteId ?? extractIdFromUrl(link.url, /anime\/(\d+)/);
      if (id) result.malId = id;
    }
  }
  return result;
}

function extractIdFromUrl(url?: string | null, pattern?: RegExp): number | undefined {
  if (!url || !pattern) return undefined;
  const match = url.match(pattern);
  if (!match) return undefined;
  const num = match[1] ?? match[2];
  return num ? parseInt(num, 10) : undefined;
}
