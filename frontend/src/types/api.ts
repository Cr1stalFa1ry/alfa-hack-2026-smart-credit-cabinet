export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface Result<T> {
  isSuccess: boolean;
  value?: T;
  error?: ApiError;
}

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
