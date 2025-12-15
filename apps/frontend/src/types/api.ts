import { Country, LocalizedEvent, EventDependencyGraph } from '@shared';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type CountriesResponse = {
  source: string;
  countries: Country[];
};

export type EventsResponse = {
  country: string;
  source: string;
  language: string;
  events: LocalizedEvent[];
  pagination?: PaginationMeta;
};

export type DependenciesResponse = {
  country: string;
  source: 'vanilla' | 'local';
  dependencies: EventDependencyGraph[];
};

export type EventFilterState = {
  triggeredOnly?: boolean;
  fireOnce?: boolean;
  major?: boolean;
  hidden?: boolean;
};
