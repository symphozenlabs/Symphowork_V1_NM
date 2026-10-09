import { AppError, errorResponse } from "@/lib/errors";
import { createExpenseClaim, listExpenseClaims } from "@/modules/expenses/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

type ExpenseItemInput = { categoryId: string; expenseDate: string; description: string; amount: number; currency?: string; merchant?: string; notes?: string };

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      const url = new URL(event.request.url);
      return { success: true, claims: await listExpenseClaims({
        organizationId: tenant.organization.id,
        userId: user.id,
        search: url.searchParams.get("search") ?? undefined,
        limit: Number(url.searchParams.get("limit") ?? 50),
        offset: Number(url.searchParams.get("offset") ?? 0)
      }) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { title?: string; description?: string; expenseDate?: string; currency?: string; items?: ExpenseItemInput[] };
    if (!body.title || !body.expenseDate || !body.items?.length) throw new AppError("VALIDATION_ERROR", "Title, expense date, and at least one item are required.", 400);
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, claim: await createExpenseClaim({
        organizationId: tenant.organization.id,
        userId: user.id,
        title: body.title!,
        description: body.description,
        expenseDate: body.expenseDate!,
        currency: body.currency,
        items: body.items!
      }) };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
