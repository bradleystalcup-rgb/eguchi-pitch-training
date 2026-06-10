function errorDetails(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { value: String(error) };
  }

  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  const cause = error.cause;
  if (cause instanceof Error) {
    details.cause = {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    };
  } else if (cause !== undefined) {
    details.cause = String(cause);
  }

  if ("code" in error) {
    details.code = error.code;
  }

  return details;
}

export function isNextDynamicServerUsageError(error: unknown) {
  return error instanceof Error && error.message.includes("Dynamic server usage:");
}

export function logServerError(message: string, error: unknown) {
  console.error(message, errorDetails(error));
}
