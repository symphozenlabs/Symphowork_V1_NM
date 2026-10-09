import type { Handle } from "@sveltejs/kit/hooks";

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  if (event.url.protocol === "https:") response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  return response;
};
