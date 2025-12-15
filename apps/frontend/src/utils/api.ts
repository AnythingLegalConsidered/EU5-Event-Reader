import axios from 'axios';
import { SupportedLanguage } from '@shared';
import { CountriesResponse, DependenciesResponse, EventsResponse } from '../types/api';

const normalizeBaseUrl = (value: string | undefined) => {
  const base = value ?? 'http://localhost:3000';
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL)
});

api.interceptors.response.use(
  response => response,
  error => {
    const message = error?.response?.data?.error ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const fetchCountries = async (
  source: 'vanilla' | 'local',
  language?: SupportedLanguage
) => {
  const params: Record<string, string> = { source };
  if (language) params.language = language;
  const { data } = await api.get<CountriesResponse>('/countries', { params });
  return data.countries;
};

export const fetchEventsByCountry = async (
  country: string,
  source: 'vanilla' | 'local',
  language: SupportedLanguage,
  options?: { page?: number; limit?: number }
) => {
  const params: Record<string, string | number> = { source, language };
  if (options?.page) params.page = options.page;
  if (options?.limit) params.limit = options.limit;
  const { data } = await api.get<EventsResponse>(`/events/${country}`, { params });
  return data;
};

export const fetchDependenciesByCountry = async (
  country: string,
  source: 'vanilla' | 'local',
  language?: SupportedLanguage
) => {
  const params: Record<string, string> = { source };
  if (language) params.language = language;
  const { data } = await api.get<DependenciesResponse>(`/dependencies/${country}`, { params });
  return data.dependencies;
};

export { api };
