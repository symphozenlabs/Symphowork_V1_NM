import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/errors";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { createApplication, publicJobBySlug } from "@/modules/ats/service";
import { uploadPublicResume } from "@/modules/resume-intelligence/service";

const publicApplication = z.object({
  firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), email: z.string().email(), phone: z.string().max(40).optional(), location: z.string().max(160).optional(), currentCompany: z.string().max(180).optional(), currentDesignation: z.string().max(160).optional(), totalExperience: z.number().min(0).max(80).optional(), expectedSalary: z.number().min(0).optional(), noticePeriodDays: z.number().int().min(0).max(365).optional(), coverNote: z.string().max(5000).optional(), consentStatus: z.literal("granted"),
});

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    enforceRateLimit(clientRateLimitKey(request, "public-application"), 20, 15 * 60_000);
    const { slug } = await context.params;
    const { job } = await publicJobBySlug(slug);
    const contentType = request.headers.get("content-type") ?? "";
    let body: z.infer<typeof publicApplication>;
    let file: File | undefined;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      file = form.get("resume") instanceof File ? form.get("resume") as File : undefined;
      body = publicApplication.parse({ firstName: String(form.get("firstName") ?? ""), lastName: String(form.get("lastName") ?? ""), email: String(form.get("email") ?? ""), phone: String(form.get("phone") ?? "") || undefined, location: String(form.get("location") ?? "") || undefined, currentCompany: String(form.get("currentCompany") ?? "") || undefined, currentDesignation: String(form.get("currentDesignation") ?? "") || undefined, totalExperience: form.get("totalExperience") ? Number(form.get("totalExperience")) : undefined, expectedSalary: form.get("expectedSalary") ? Number(form.get("expectedSalary")) : undefined, noticePeriodDays: form.get("noticePeriodDays") ? Number(form.get("noticePeriodDays")) : undefined, coverNote: String(form.get("coverNote") ?? "") || undefined, consentStatus: String(form.get("consentStatus")) });
    } else {
      body = publicApplication.parse(await request.json());
    }
    const result = await createApplication({ organizationId: job.organizationId, jobId: job.id, candidateData: body, coverNote: body.coverNote });
    if (file) await uploadPublicResume({ organizationId: job.organizationId, candidateId: result.candidateId, applicationId: result.id, fileName: file.name, mimeType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
    return NextResponse.json({ success: true, application: { id: result.id, status: result.status } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
