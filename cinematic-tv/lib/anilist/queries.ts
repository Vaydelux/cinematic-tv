export const MEDIA_CARD_FIELDS = `
  id
  idMal
  type
  format
  status
  episodes
  averageScore
  isAdult
  title { romaji english native userPreferred }
  coverImage { extraLarge large color }
  bannerImage
  genres
`;

export const MEDIA_DETAIL_FIELDS = `
  ${MEDIA_CARD_FIELDS}
  description(asHtml: false)
  trailer { id site thumbnail }
`;

export const MEDIA_SEARCH = `
query ($search: String, $page: Int, $perPage: Int, $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage currentPage }
    media(search: $search, type: ANIME, isAdult: $isAdult) {
      ${MEDIA_CARD_FIELDS}
    }
  }
}`;

export const TRENDING_ANIME = `
query ($page: Int, $perPage: Int, $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(type: ANIME, sort: TRENDING_DESC, isAdult: $isAdult) {
      ${MEDIA_CARD_FIELDS}
    }
  }
}`;

export const POPULAR_ANIME = `
query ($page: Int, $perPage: Int, $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage currentPage }
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: $isAdult) {
      ${MEDIA_CARD_FIELDS}
    }
  }
}`;

export const DISCOVER_ANIME = `
query ($page: Int, $perPage: Int, $isAdult: Boolean, $genreIn: [String], $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage currentPage }
    media(type: ANIME, genre_in: $genreIn, sort: $sort, isAdult: $isAdult) {
      ${MEDIA_CARD_FIELDS}
    }
  }
}`;

export const TOP_RATED_ANIME = `
query ($page: Int, $perPage: Int, $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage currentPage }
    media(type: ANIME, sort: SCORE_DESC, isAdult: $isAdult) {
      ${MEDIA_CARD_FIELDS}
    }
  }
}`;

export const AIRING_ANIME = `
query ($page: Int, $perPage: Int, $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage currentPage }
    media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: $isAdult) {
      ${MEDIA_CARD_FIELDS}
    }
  }
}`;

export const MEDIA_BY_ID = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    ${MEDIA_DETAIL_FIELDS}
    externalLinks { site url siteId type }
    relations {
      edges {
        relationType
        node {
          id
          type
          title { romaji english }
          coverImage { medium }
        }
      }
    }
    streamingEpisodes { title thumbnail url site }
    nextAiringEpisode { episode timeUntilAiring }
  }
}`;

export const ALLOWED_OPERATIONS: Record<string, string> = {
  searchAnime: MEDIA_SEARCH,
  trendingAnime: TRENDING_ANIME,
  popularAnime: POPULAR_ANIME,
  discoverAnime: DISCOVER_ANIME,
  topRatedAnime: TOP_RATED_ANIME,
  airingAnime: AIRING_ANIME,
  mediaById: MEDIA_BY_ID,
};
