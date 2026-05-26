import type { SearchRequest, MultiCitySearchRequest, SearchResult } from './flight.js';

export interface FlightProvider {
  readonly name: string;
  search(request: SearchRequest): Promise<SearchResult>;
  searchMultiCity?(request: MultiCitySearchRequest): Promise<SearchResult>;
}
