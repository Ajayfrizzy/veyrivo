import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const apiError = (error: unknown) => {
  if (error instanceof ApiError)
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request is invalid.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  console.error(error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "The request could not be completed." } },
    { status: 500 },
  );
};

export const withApi =
  <T extends unknown[]>(handler: (...args: T) => Promise<Response>) =>
  (...args: T) =>
    handler(...args).catch(apiError);
