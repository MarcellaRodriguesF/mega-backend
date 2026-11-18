export interface ApiErrorDetails {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: ApiErrorDetails[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
