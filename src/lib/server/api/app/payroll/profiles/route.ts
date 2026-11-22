import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import {
  listEmployeePayrollProfiles,
  upsertEmployeePayrollProfile,
} from "@/modules/payroll/service";

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const profiles = await listEmployeePayrollProfiles({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
    });
    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const body = (await request.json()) as {
      employeeId?: string;
      status?: "eligible" | "ineligible" | "on_hold";
      effectiveDate?: string;
      panEncrypted?: string;
      bankMetadataEncrypted?: string;
      uan?: string;
      pfApplicable?: boolean;
      esiApplicable?: boolean;
      esiNumber?: string;
      professionalTaxApplicable?: boolean;
      tdsApplicable?: boolean;
      taxRegime?: "old" | "new";
    };

    if (!body.employeeId || !body.effectiveDate) {
      throw new AppError("VALIDATION_ERROR", "Employee ID and effective date are required.", 400);
    }

    const profile = await upsertEmployeePayrollProfile({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      employeeId: body.employeeId,
      status: body.status,
      effectiveDate: body.effectiveDate,
      panEncrypted: body.panEncrypted,
      bankMetadataEncrypted: body.bankMetadataEncrypted,
      uan: body.uan,
      pfApplicable: body.pfApplicable,
      esiApplicable: body.esiApplicable,
      esiNumber: body.esiNumber,
      professionalTaxApplicable: body.professionalTaxApplicable,
      tdsApplicable: body.tdsApplicable,
      taxRegime: body.taxRegime,
    });

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
