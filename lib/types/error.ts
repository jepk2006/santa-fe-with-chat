export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: string | Record<string, unknown>;
}

export type ErrorResponse = {
  success: false;
  message: string;
  error?: AppError;
};

export type SuccessResponse<T> = {
  success: true;
  message?: string;
  data?: T;
}; 