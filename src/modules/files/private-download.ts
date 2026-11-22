import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { atsCandidateDocuments, documentHistory, employeeDocuments, employees } from "@/db/schema";
import { authorize } from "@/modules/tenancy/authorization";
import { getStorageProvider } from "@/lib/storage";
import { AppError } from "@/lib/errors";

export type PrivateFileDownload = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
};

export async function readAuthorizedLocalFile(input: {
  organizationId: string;
  userId: string;
  storageKey: string;
}): Promise<PrivateFileDownload> {
  const [employee] = await db.select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.organizationId, input.organizationId), eq(employees.userId, input.userId)));

  if (employee) {
    const [document] = await db.select().from(employeeDocuments).where(and(
      eq(employeeDocuments.organizationId, input.organizationId),
      eq(employeeDocuments.employeeId, employee.id),
      eq(employeeDocuments.storageKey, input.storageKey),
      eq(employeeDocuments.lifecycleStatus, "active"),
      eq(employeeDocuments.scanStatus, "clean")
    ));
    if (document) {
      await authorize({ organizationId: input.organizationId, permission: "document.download" });
      await db.insert(documentHistory).values({
        organizationId: input.organizationId,
        documentId: document.id,
        actorUserId: input.userId,
        action: "downloaded",
        previousStatus: document.status
      });
      return {
        bytes: await getStorageProvider().download(document.storageKey),
        fileName: document.fileName,
        mimeType: document.mimeType ?? "application/octet-stream"
      };
    }
  }

  await authorize({ organizationId: input.organizationId, permission: "ats.candidate.view" });
  const [resume] = await db.select().from(atsCandidateDocuments).where(and(
    eq(atsCandidateDocuments.organizationId, input.organizationId),
    eq(atsCandidateDocuments.storageKey, input.storageKey),
    eq(atsCandidateDocuments.scanStatus, "clean")
  ));
  if (!resume) throw new AppError("NOT_FOUND", "The requested file was not found.", 404);

  return {
    bytes: await getStorageProvider().download(resume.storageKey),
    fileName: resume.fileName,
    mimeType: resume.mimeType
  };
}
