import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { markPayrollRunPaid } from "@/modules/payroll/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const { runId } = await context.params;
    const body = (await request.json()) as {
      paymentReference?: string;
      paymentDate?: string;
      notes?: string;
    };

    if (!body.paymentReference || !body.paymentDate) {
      throw new AppError("VALIDATION_ERROR", "Payment reference and payment date are required.", 400);
    }

    const run = await markPayrollRunPaid({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      runId,
      paymentReference: body.paymentReference,
      paymentDate: body.paymentDate,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, run });
  } catch (error) {
    return errorResponse(error);
  }
}
