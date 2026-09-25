import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { approvalTasks, attendanceRecords, employeePayrollProfiles, employeeSalaryAssignments, employees, holidays, leaveApplications, leaveTypes, payrollAdjustments, payrollCalculationSnapshots, payrollLineItems, payrollPayslips, payrollPeriods, payrollRunEmployees, payrollRuns, payrollStatutoryConfigurations, payrollTaxConfigurations, salaryComponents, salaryStructureComponents, salaryStructures, workingDays } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { calculatePayroll, PAYROLL_CALCULATION_VERSION, type PayrollAdjustment, type PayrollComponent, type StatutoryInputs } from "./calculator";
import { createWorkflowInstance, ensureDefaultWorkflow } from "@/modules/workflows/service";
import { notifyUsers } from "@/modules/notifications/service";

function periodDates(month: number, year: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200) throw new AppError("VALIDATION_ERROR", "A valid payroll month and year are required.", 400);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { start, end };
}

function daysBetween(start: string, end: string) {
  const dates: string[] = [];
  for (const cursor = new Date(`${start}T00:00:00Z`); cursor <= new Date(`${end}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) dates.push(cursor.toISOString().slice(0, 10));
  return dates;
}

function parseConfig(value: string | null | undefined): Record<string, unknown> {
  try { return value ? JSON.parse(value) as Record<string, unknown> : {}; } catch { return {}; }
}
function numberConfig(config: Record<string, unknown>, key: string, fallback: number | undefined = 0) { return typeof config[key] === "number" ? config[key] as number : fallback; }

export async function createPayrollPeriod(input: { organizationId: string; userId: string; month: number; year: number }) {
  await authorize({ organizationId: input.organizationId, permission: "payroll.manage" });
  const dates = periodDates(input.month, input.year);
  const [period] = await db.insert(payrollPeriods).values({ organizationId: input.organizationId, month: input.month, year: input.year, periodStart: dates.start, periodEnd: dates.end, status: "open" }).onConflictDoNothing().returning();
  if (!period) throw new AppError("VALIDATION_ERROR", "A payroll period already exists for this month.", 409);
  await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "payroll_period_created", resource: "payroll_period", resourceId: period.id, metadata: { month: input.month, year: input.year } });
  return period;
}

export async function listPayrollRuns(input: { organizationId: string; userId: string }) {
  await authorize({ organizationId: input.organizationId, permission: "payroll.view" });
  return db.select().from(payrollRuns).where(eq(payrollRuns.organizationId, input.organizationId)).orderBy(desc(payrollRuns.createdAt));
}

export async function assignSalaryStructure(input: { organizationId: string; userId: string; employeeId: string; structureId: string; effectiveFrom: string; effectiveTo?: string; revisionReason?: string; notes?: string }) {
  await authorize({ organizationId: input.organizationId, permission: "payroll.configure" });
  const [employee] = await db.select().from(employees).where(and(eq(employees.id, input.employeeId), eq(employees.organizationId, input.organizationId)));
  const [structure] = await db.select().from(salaryStructures).where(and(eq(salaryStructures.id, input.structureId), eq(salaryStructures.organizationId, input.organizationId)));
  if (!employee || !structure) throw new AppError("NOT_FOUND", "Employee or salary structure was not found.", 404);
  if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) throw new AppError("VALIDATION_ERROR", "The salary assignment end date must be on or after the start date.", 400);
  const existing = await db.select().from(employeeSalaryAssignments).where(and(eq(employeeSalaryAssignments.organizationId, input.organizationId), eq(employeeSalaryAssignments.employeeId, input.employeeId)));
  const overlaps = existing.some((row) => row.effectiveFrom <= (input.effectiveTo ?? "9999-12-31") && (row.effectiveTo ?? "9999-12-31") >= input.effectiveFrom);
  if (overlaps) throw new AppError("VALIDATION_ERROR", "Salary assignment dates cannot overlap.", 409);
  const [assignment] = await db.insert(employeeSalaryAssignments).values({ organizationId: input.organizationId, employeeId: input.employeeId, structureId: input.structureId, effectiveFrom: input.effectiveFrom, effectiveTo: input.effectiveTo, revisionReason: input.revisionReason, notes: input.notes, createdByUserId: input.userId }).returning();
  await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "salary_assignment_created", resource: "employee_salary_assignment", resourceId: assignment.id, metadata: { employeeId: input.employeeId, structureId: input.structureId } });
  return assignment;
}

async function statutoryInputs(organizationId: string, periodStart: string, profile: typeof employeePayrollProfiles.$inferSelect): Promise<StatutoryInputs> {
  const configs = await db.select().from(payrollStatutoryConfigurations).where(and(eq(payrollStatutoryConfigurations.organizationId, organizationId), eq(payrollStatutoryConfigurations.active, true), lte(payrollStatutoryConfigurations.effectiveFrom, periodStart), or(isNull(payrollStatutoryConfigurations.effectiveTo), gte(payrollStatutoryConfigurations.effectiveTo, periodStart))));
  const byCode = new Map(configs.map((config) => [config.code, parseConfig(config.configuration)]));
  const pf = byCode.get("PF"); const esi = byCode.get("ESI"); const pt = byCode.get("PT");
  const tax = await db.select().from(payrollTaxConfigurations).where(and(eq(payrollTaxConfigurations.organizationId, organizationId), eq(payrollTaxConfigurations.regime, profile.taxRegime), eq(payrollTaxConfigurations.active, true), lte(payrollTaxConfigurations.effectiveFrom, periodStart), or(isNull(payrollTaxConfigurations.effectiveTo), gte(payrollTaxConfigurations.effectiveTo, periodStart)))).orderBy(desc(payrollTaxConfigurations.effectiveFrom));
  const taxConfig = parseConfig(tax[0]?.configuration);
  return { pf: { applicable: profile.pfApplicable && !!pf, employeeRate: numberConfig(pf ?? {}, "employeeRate"), employerRate: numberConfig(pf ?? {}, "employerRate"), wageCeiling: numberConfig(pf ?? {}, "wageCeiling", undefined) }, esi: { applicable: profile.esiApplicable && !!esi, employeeRate: numberConfig(esi ?? {}, "employeeRate"), employerRate: numberConfig(esi ?? {}, "employerRate"), wageCeiling: numberConfig(esi ?? {}, "wageCeiling", undefined) }, professionalTax: { applicable: profile.professionalTaxApplicable && !!pt, amount: numberConfig(pt ?? {}, "amount") }, tds: { applicable: profile.tdsApplicable && !!tax[0], amount: numberConfig(taxConfig, "monthlyAmount") } };
}

export async function calculatePayrollRun(input: { organizationId: string; userId: string; periodId: string }) {
  await authorize({ organizationId: input.organizationId, permission: "payroll.calculate" });
  const [period] = await db.select().from(payrollPeriods).where(and(eq(payrollPeriods.id, input.periodId), eq(payrollPeriods.organizationId, input.organizationId)));
  if (!period) throw new AppError("NOT_FOUND", "Payroll period was not found.", 404);
  if (["finalized", "locked"].includes(period.status)) throw new AppError("VALIDATION_ERROR", "A finalized payroll period cannot be recalculated.", 409);
  const profiles = await db.select().from(employeePayrollProfiles).where(and(eq(employeePayrollProfiles.organizationId, input.organizationId), eq(employeePayrollProfiles.status, "eligible")));
  const employeeRows = await db.select().from(employees).where(and(eq(employees.organizationId, input.organizationId), inArray(employees.id, profiles.map((profile) => profile.employeeId)), inArray(employees.status, ["active", "probation", "confirmed", "notice_period"])));
  if (!employeeRows.length) throw new AppError("VALIDATION_ERROR", "No eligible employees are configured for this payroll period.", 422);
  const workingDayRows = await db.select().from(workingDays).where(eq(workingDays.organizationId, input.organizationId));
  const workingDaySet = new Set(workingDayRows.filter((row) => row.isWorkingDay).map((row) => row.dayOfWeek));
  const holidayRows = await db.select().from(holidays).where(and(eq(holidays.organizationId, input.organizationId), gte(holidays.holidayDate, period.periodStart), lte(holidays.holidayDate, period.periodEnd), eq(holidays.status, "active")));
  const holidaySet = new Set(holidayRows.map((row) => row.holidayDate));
  const allDates = daysBetween(period.periodStart, period.periodEnd);
  const workingDates = allDates.filter((date) => workingDaySet.size === 0 || (workingDaySet.has(new Date(`${date}T00:00:00Z`).getUTCDay() || 7) && !holidaySet.has(date)));
  const existingRuns = await db.select().from(payrollRuns).where(and(eq(payrollRuns.organizationId, input.organizationId), eq(payrollRuns.periodId, period.id), inArray(payrollRuns.status, ["processing", "under_review", "approved", "finalized", "locked"])));
  if (existingRuns.length) throw new AppError("VALIDATION_ERROR", "An active payroll run already exists for this period.", 409);
  const runNumber = `RUN-${period.year}-${String(period.month).padStart(2, "0")}-${Date.now()}`;
  const [run] = await db.insert(payrollRuns).values({ organizationId: input.organizationId, periodId: period.id, runNumber, status: "processing", createdByUserId: input.userId }).returning();
  let grossTotal = 0, deductionTotal = 0, netTotal = 0, employerTotal = 0, warningCount = 0;
  try {
    for (const employee of employeeRows) {
      const profile = profiles.find((row) => row.employeeId === employee.id)!;
      const assignments = await db.select().from(employeeSalaryAssignments).where(and(eq(employeeSalaryAssignments.organizationId, input.organizationId), eq(employeeSalaryAssignments.employeeId, employee.id), lte(employeeSalaryAssignments.effectiveFrom, period.periodEnd), or(isNull(employeeSalaryAssignments.effectiveTo), gte(employeeSalaryAssignments.effectiveTo, period.periodStart)))).orderBy(desc(employeeSalaryAssignments.effectiveFrom));
      const assignment = assignments[0];
      if (!assignment) continue;
      const [structure] = await db.select().from(salaryStructures).where(and(eq(salaryStructures.id, assignment.structureId), eq(salaryStructures.organizationId, input.organizationId)));
      if (!structure) continue;
      const componentRows = await db.select({ link: salaryStructureComponents, component: salaryComponents }).from(salaryStructureComponents).innerJoin(salaryComponents, eq(salaryStructureComponents.componentId, salaryComponents.id)).where(and(eq(salaryStructureComponents.organizationId, input.organizationId), eq(salaryStructureComponents.structureId, structure.id), eq(salaryComponents.active, true))).orderBy(salaryStructureComponents.displayOrder);
      const components: PayrollComponent[] = componentRows.map(({ link, component }) => ({ code: component.code, name: component.name, type: component.type, method: component.calculationMethod, fixedAmount: link.fixedAmount ?? undefined, percentage: link.percentage ?? undefined, baseCode: link.formulaReference ?? undefined, taxable: component.taxable, proratable: component.proratable, statutory: component.statutory }));
      const attendance = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.organizationId, input.organizationId), eq(attendanceRecords.employeeId, employee.id), gte(attendanceRecords.attendanceDate, period.periodStart), lte(attendanceRecords.attendanceDate, period.periodEnd)));
      const absentDays = attendance.filter((row) => ["absent", "missing_punch"].includes(row.status)).length;
      const approvedLeaves = await db.select({ application: leaveApplications, leaveType: leaveTypes }).from(leaveApplications).innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id)).where(and(eq(leaveApplications.organizationId, input.organizationId), eq(leaveApplications.employeeId, employee.id), eq(leaveApplications.status, "approved"), lte(leaveApplications.startDate, period.periodEnd), gte(leaveApplications.endDate, period.periodStart)));
      const paidLeaveDays = approvedLeaves.filter((row) => row.leaveType.paid).reduce((sum, row) => sum + row.application.requestedDays, 0);
      const unpaidLeaveDays = approvedLeaves.filter((row) => !row.leaveType.paid).reduce((sum, row) => sum + row.application.requestedDays, 0);
      const lopDays = Math.min(workingDates.length, absentDays + unpaidLeaveDays);
      const adjustments = await db.select().from(payrollAdjustments).where(and(eq(payrollAdjustments.organizationId, input.organizationId), eq(payrollAdjustments.periodId, period.id), eq(payrollAdjustments.employeeId, employee.id), eq(payrollAdjustments.status, "approved"))).then((rows) => rows.map((row): PayrollAdjustment => ({ type: ["recovery", "advance_recovery", "manual_deduction"].includes(row.type) ? "deduction" : "earning", code: `ADJ_${row.type.toUpperCase()}`, name: row.reason, amount: row.amount })));
      const statutory = await statutoryInputs(input.organizationId, period.periodStart, profile);
      const result = calculatePayroll({ periodStart: period.periodStart, periodEnd: period.periodEnd, calendarDays: allDates.length, workingDays: workingDates.length, eligibleCalendarDays: allDates.length, eligibleWorkingDays: workingDates.length, paidLeaveDays, unpaidLeaveDays, absentDays, lopDays, prorationBasis: "calendar_days", components, adjustments, statutory });
      const inputSnapshot = { employeeId: employee.id, assignmentId: assignment.id, attendanceCount: attendance.length, paidLeaveDays, unpaidLeaveDays, absentDays, lopDays };
      const [runEmployee] = await db.insert(payrollRunEmployees).values({ organizationId: input.organizationId, runId: run.id, employeeId: employee.id, status: "calculated" }).returning();
      const [snapshot] = await db.insert(payrollCalculationSnapshots).values({ organizationId: input.organizationId, runEmployeeId: runEmployee.id, employeeId: employee.id, calculationVersion: PAYROLL_CALCULATION_VERSION, inputSnapshot: JSON.stringify(inputSnapshot), resultSnapshot: JSON.stringify(result), payableDays: result.payableDays, lopDays: result.lopDays, grossEarnings: result.grossEarnings, totalDeductions: result.totalDeductions, netSalary: result.netSalary, employerContributions: result.employerContributions }).returning();
      await db.insert(payrollLineItems).values(result.lines.map((line) => ({ organizationId: input.organizationId, snapshotId: snapshot.id, code: line.code, name: line.name, type: line.type, amount: line.amount, taxable: line.taxable, statutoryConfigurationSnapshot: line.statutory ? JSON.stringify(statutory) : undefined })));
      grossTotal += result.grossEarnings; deductionTotal += result.totalDeductions; netTotal += result.netSalary; employerTotal += result.employerContributions; warningCount += result.warnings.length;
    }
    const [firstRunEmployee] = await db.select().from(payrollRunEmployees).where(eq(payrollRunEmployees.runId, run.id)).orderBy(payrollRunEmployees.createdAt);
    if (!firstRunEmployee) throw new AppError("VALIDATION_ERROR", "No employees could be calculated because salary assignments are missing.", 422);
    await ensureDefaultWorkflow(input.organizationId, "payroll", input.userId);
    const workflow = await createWorkflowInstance({ organizationId: input.organizationId, workflowType: "payroll", entityType: "payroll_run", entityId: run.id, subjectEmployeeId: firstRunEmployee.employeeId, submittedByUserId: input.userId });
    const tasks = await db.select().from(approvalTasks).where(eq(approvalTasks.workflowInstanceId, workflow.id));
    await notifyUsers({ organizationId: input.organizationId, recipientUserIds: tasks.map((task) => task.approverUserId), category: "approvals", type: "payroll.submitted", title: "Payroll approval required", message: `${run.runNumber} is ready for payroll review.`, entityType: "payroll_run", entityId: run.id, actionUrl: "/app/approvals", idempotencyKey: `payroll.submitted:${run.id}` });
    const [updated] = await db.update(payrollRuns).set({ workflowInstanceId: workflow.id, status: "under_review", calculatedAt: new Date(), employeeCount: await db.select().from(payrollRunEmployees).where(eq(payrollRunEmployees.runId, run.id)).then((rows) => rows.length), grossTotal, deductionTotal, netTotal, employerContributionTotal: employerTotal, warningCount, updatedAt: new Date() }).where(eq(payrollRuns.id, run.id)).returning();
    await db.update(payrollPeriods).set({ status: "under_review", updatedAt: new Date() }).where(eq(payrollPeriods.id, period.id));
    await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "payroll_run_calculated", resource: "payroll_run", resourceId: run.id, metadata: { warningCount } });
    return updated;
  } catch (error) { await db.update(payrollRuns).set({ status: "failed", updatedAt: new Date() }).where(eq(payrollRuns.id, run.id)); throw error; }
}

export async function finalizePayrollRun(input: { organizationId: string; userId: string; runId: string }) {
  await authorize({ organizationId: input.organizationId, permission: "payroll.finalize" });
  const [run] = await db.select().from(payrollRuns).where(and(eq(payrollRuns.id, input.runId), eq(payrollRuns.organizationId, input.organizationId)));
  if (!run || run.status !== "approved") throw new AppError("VALIDATION_ERROR", "Only an approved payroll run can be finalized.", 409);
  const [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, run.periodId));
  if (!period) throw new AppError("NOT_FOUND", "Payroll period was not found.", 404);
  const runEmployees = await db.select().from(payrollRunEmployees).where(eq(payrollRunEmployees.runId, run.id));
  for (const runEmployee of runEmployees) {
    const [snapshot] = await db.select().from(payrollCalculationSnapshots).where(eq(payrollCalculationSnapshots.runEmployeeId, runEmployee.id));
    const [employee] = await db.select().from(employees).where(eq(employees.id, runEmployee.employeeId));
    if (!snapshot || !employee) continue;
    await db.update(payrollCalculationSnapshots).set({ frozenAt: new Date() }).where(eq(payrollCalculationSnapshots.id, snapshot.id));
    await db.insert(payrollPayslips).values({ organizationId: input.organizationId, runEmployeeId: runEmployee.id, employeeId: employee.id, payslipNumber: `PSL-${period.year}-${String(period.month).padStart(2, "0")}-${employee.employeeId}`, snapshotId: snapshot.id }).onConflictDoNothing();
  }
  const [finalized] = await db.update(payrollRuns).set({ status: "finalized", finalizedAt: new Date(), updatedAt: new Date() }).where(eq(payrollRuns.id, run.id)).returning();
  await db.update(payrollPeriods).set({ status: "finalized", updatedAt: new Date() }).where(eq(payrollPeriods.id, period.id));
  await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "payroll_run_finalized", resource: "payroll_run", resourceId: run.id });
  return finalized;
}

export async function listEmployeePayslips(input: { organizationId: string; userId: string }) {
  await authorize({ organizationId: input.organizationId, permission: "payslip.view" });
  const [employee] = await db.select().from(employees).where(and(eq(employees.organizationId, input.organizationId), eq(employees.userId, input.userId)));
  if (!employee) throw new AppError("NOT_FOUND", "Your employee profile is not linked.", 404);
  return db.select({ payslip: payrollPayslips, run: payrollRuns, period: payrollPeriods, snapshot: payrollCalculationSnapshots }).from(payrollPayslips).innerJoin(payrollRunEmployees, eq(payrollPayslips.runEmployeeId, payrollRunEmployees.id)).innerJoin(payrollRuns, eq(payrollRunEmployees.runId, payrollRuns.id)).innerJoin(payrollPeriods, eq(payrollRuns.periodId, payrollPeriods.id)).innerJoin(payrollCalculationSnapshots, eq(payrollPayslips.snapshotId, payrollCalculationSnapshots.id)).where(and(eq(payrollPayslips.organizationId, input.organizationId), eq(payrollPayslips.employeeId, employee.id), eq(payrollRuns.status, "finalized"))).orderBy(desc(payrollPayslips.generatedAt));
}
