/**
 * Navigation routing utility functions for SymphoWork enterprise shells.
 * Ensures strict, single-active route detection across nested and parent routes.
 */

/**
 * Determines whether targetHref is the active route given currentPath and all navigable hrefs.
 * 
 * Rules:
 * 1. Exact match always wins: currentPath === targetHref -> true
 * 2. Root overview paths (/app, /platform) require exact match to avoid matching all sub-pages.
 * 3. For nested routes (e.g. /app/employees/123): matches if currentPath starts with `${targetHref}/`.
 * 4. Resolves conflicts (e.g. /app/payroll vs /app/payroll/payslips, or /app/settings vs /app/settings/workflows):
 *    If a more specific href in allHrefs also matches currentPath, the shorter parent href yields.
 */
export function isRouteActive(
  currentPath: string | null | undefined,
  targetHref: string,
  allHrefs: string[] = []
): boolean {
  if (!currentPath) return false;

  // 1. Exact match
  if (currentPath === targetHref) {
    return true;
  }

  // 2. Root overview routes require exact match
  if (targetHref === "/app" || targetHref === "/platform") {
    return false;
  }

  // 3. Nested sub-route prefix match
  if (currentPath.startsWith(`${targetHref}/`)) {
    // 4. Check if a more specific route in allHrefs is also matched
    const hasMoreSpecificMatch = allHrefs.some(
      (otherHref) =>
        otherHref !== targetHref &&
        otherHref.length > targetHref.length &&
        (currentPath === otherHref || currentPath.startsWith(`${otherHref}/`))
    );
    return !hasMoreSpecificMatch;
  }

  return false;
}
