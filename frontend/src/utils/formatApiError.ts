export function formatApiError(error: unknown, fallbackMessage = "Unable to complete request."): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    const detail = response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null) {
            const errObj = item as { loc?: (string | number)[]; msg?: string };
            const loc = Array.isArray(errObj.loc)
              ? errObj.loc.filter((part) => part !== "body").join(".")
              : "";
            return loc && errObj.msg ? `${loc}: ${errObj.msg}` : errObj.msg || JSON.stringify(item);
          }
          return String(item);
        })
        .join("; ");
    }

    if (typeof detail === "object" && detail !== null) {
      return JSON.stringify(detail);
    }

    return fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
