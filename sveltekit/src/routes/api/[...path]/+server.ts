import { forwardLegacyRequest } from "$lib/server/legacy-api";

async function forward({ request, params, fetch }: { request: Request; params: { path: string }; fetch: typeof globalThis.fetch }) {
  return forwardLegacyRequest({ request, path: params.path, fetch });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
