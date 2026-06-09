export type AniListMedia = {
  id: number;
  idMal?: number | null;
  type: 'ANIME' | 'MANGA';
  format?: string;
  status?: string;
  episodes?: number | null;
  averageScore?: number | null;
  description?: string | null;
  isAdult?: boolean;
  title: { romaji?: string; english?: string; native?: string; userPreferred?: string };
  coverImage?: { extraLarge?: string; large?: string; color?: string };
  bannerImage?: string | null;
  trailer?: { id?: string | null; site?: string | null; thumbnail?: string | null } | null;
  genres?: string[];
  externalLinks?: { site: string; url?: string; siteId?: number | null }[];
  relations?: {
    edges: {
      relationType: string;
      node: {
        id: number;
        type: string;
        title: { romaji?: string; english?: string };
        coverImage?: { medium?: string };
      };
    }[];
  };
  streamingEpisodes?: { title: string; thumbnail?: string; url?: string; site?: string }[];
};

export type AniListPageResponse = {
  Page: {
    pageInfo?: { hasNextPage: boolean; currentPage?: number };
    media: AniListMedia[];
  };
};

export type AniListMediaResponse = {
  Media: AniListMedia | null;
};
