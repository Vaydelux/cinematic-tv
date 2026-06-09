export type CatalogGenre = {
  id: string;
  name: string;
  tmdbMovieId?: number;
  tmdbTvId?: number;
  anilistGenre?: string;
};

export const CATALOG_GENRES: CatalogGenre[] = [
  { id: 'action', name: 'Action', tmdbMovieId: 28, tmdbTvId: 10759, anilistGenre: 'Action' },
  { id: 'adventure', name: 'Adventure', tmdbMovieId: 12, tmdbTvId: 10759, anilistGenre: 'Adventure' },
  { id: 'animation', name: 'Animation', tmdbMovieId: 16, tmdbTvId: 16 },
  { id: 'comedy', name: 'Comedy', tmdbMovieId: 35, tmdbTvId: 35, anilistGenre: 'Comedy' },
  { id: 'crime', name: 'Crime', tmdbMovieId: 80, tmdbTvId: 80 },
  { id: 'documentary', name: 'Documentary', tmdbMovieId: 99, tmdbTvId: 99 },
  { id: 'drama', name: 'Drama', tmdbMovieId: 18, tmdbTvId: 18, anilistGenre: 'Drama' },
  { id: 'family', name: 'Family', tmdbMovieId: 10751, tmdbTvId: 10751 },
  { id: 'fantasy', name: 'Fantasy', tmdbMovieId: 14, tmdbTvId: 10765, anilistGenre: 'Fantasy' },
  { id: 'history', name: 'History', tmdbMovieId: 36 },
  { id: 'horror', name: 'Horror', tmdbMovieId: 27, anilistGenre: 'Horror' },
  { id: 'music', name: 'Music', tmdbMovieId: 10402 },
  { id: 'mystery', name: 'Mystery', tmdbMovieId: 9648, tmdbTvId: 9648, anilistGenre: 'Mystery' },
  { id: 'romance', name: 'Romance', tmdbMovieId: 10749, tmdbTvId: 10749, anilistGenre: 'Romance' },
  { id: 'sci-fi', name: 'Sci-Fi', tmdbMovieId: 878, tmdbTvId: 10765, anilistGenre: 'Sci-Fi' },
  { id: 'sports', name: 'Sports', anilistGenre: 'Sports' },
  { id: 'supernatural', name: 'Supernatural', anilistGenre: 'Supernatural' },
  { id: 'thriller', name: 'Thriller', tmdbMovieId: 53, anilistGenre: 'Thriller' },
  { id: 'war', name: 'War', tmdbMovieId: 10752, tmdbTvId: 10768 },
  { id: 'western', name: 'Western', tmdbMovieId: 37, tmdbTvId: 37 },
];

export const DEFAULT_HOME_GENRE_IDS = CATALOG_GENRES.map((genre) => genre.id);

export function getCatalogGenre(id: string | null | undefined) {
  return CATALOG_GENRES.find((genre) => genre.id === id);
}
