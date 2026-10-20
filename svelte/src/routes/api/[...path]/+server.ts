import type { RequestHandler } from './$types';
import { relay } from '$lib/server/legacy';
const handle: RequestHandler = ({ request, getClientAddress }) => {
  let address: string | undefined;
  try { address = getClientAddress(); } catch { /* build/test adapters may have no client address */ }
  return relay(request, fetch, undefined, address);
};
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS, handle as HEAD };

