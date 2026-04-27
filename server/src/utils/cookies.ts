import type { Request } from "express";

export const getCookieValue = (
  req: Request,
  key: string,
): string | undefined => {
  const rawCookieHeader = req.headers.cookie;
  if (!rawCookieHeader) {
    return undefined;
  }

  const cookiePairs = rawCookieHeader.split(";");
  for (const pair of cookiePairs) {
    const [rawName, ...rawValueParts] = pair.trim().split("=");
    if (rawName === key) {
      return decodeURIComponent(rawValueParts.join("="));
    }
  }

  return undefined;
};
