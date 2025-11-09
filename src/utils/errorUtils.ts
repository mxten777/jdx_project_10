// Type guard utilities for error handling
export const isFirebaseError = (error: unknown): error is { code: string; message: string } => {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
};

export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const toError = (error: unknown): Error => {
  if (isError(error)) return error;
  if (isFirebaseError(error)) return new Error(error.message);
  return new Error(String(error));
};

export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) return error.message;
  if (isFirebaseError(error)) return error.message;
  return String(error);
};

export const getErrorCode = (error: unknown): string | undefined => {
  if (isFirebaseError(error)) return error.code;
  return undefined;
};