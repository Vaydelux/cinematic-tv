export type CountryFilterId =
  | 'all'
  | 'PH'
  | 'US'
  | 'KR'
  | 'JP'
  | 'CN'
  | 'HK'
  | 'IN'
  | 'TH'
  | 'ID'
  | 'GB'
  | 'FR'
  | 'ES';

export type RatingFilterId = 'all' | '6' | '7' | '8' | '9';

export type CountryFilter = {
  id: CountryFilterId;
  label: string;
};

export type RatingFilter = {
  id: RatingFilterId;
  label: string;
  min?: number;
};

export const COUNTRY_FILTERS: CountryFilter[] = [
  { id: 'all', label: 'All countries' },
  { id: 'US', label: 'United States' },
  { id: 'KR', label: 'Korea' },
  { id: 'JP', label: 'Japan' },
  { id: 'CN', label: 'China' },
  { id: 'HK', label: 'Hong Kong' },
  { id: 'IN', label: 'India' },
  { id: 'TH', label: 'Thailand' },
  { id: 'ID', label: 'Indonesia' },
  { id: 'GB', label: 'United Kingdom' },
  { id: 'FR', label: 'France' },
  { id: 'ES', label: 'Spain' },
];

export const RATING_FILTERS: RatingFilter[] = [
  { id: 'all', label: 'Any rating' },
  { id: '6', label: '6.0+', min: 6 },
  { id: '7', label: '7.0+', min: 7 },
  { id: '8', label: '8.0+', min: 8 },
  { id: '9', label: '9.0+', min: 9 },
];

export function getCountryFilter(id: string | null | undefined) {
  return COUNTRY_FILTERS.find((country) => country.id === id);
}

export function getRatingFilter(id: string | null | undefined) {
  return RATING_FILTERS.find((rating) => rating.id === id);
}
