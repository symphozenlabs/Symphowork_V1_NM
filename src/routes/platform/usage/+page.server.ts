import { redirect } from "@sveltejs/kit";

export const load: import("./$types").PageServerLoad = ({ url }) => {
  redirect(308, `/platform/subscriptions${url.search}`);
};
