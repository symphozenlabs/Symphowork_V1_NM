export const queryTypes = {
  bug_technical: "Bug / Technical Issue",
  product_query: "Product Query",
  feature_request: "Feature Request",
  subscription_billing: "Subscription & Billing",
  terms_compliance: "Terms & Compliance",
  other: "Other",
};
export function queryLabel(key: string) {
  return queryTypes[key as keyof typeof queryTypes] ?? key;
}
export async function supportRequest(url: string, body?: FormData | object) {
  const form = body instanceof FormData;
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body && !form ? { "content-type": "application/json" } : undefined,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Request failed.");
  return data;
}
