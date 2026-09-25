export const PAYROLL_CALCULATION_VERSION = "v1";
export type PayrollComponentType = "earning" | "deduction" | "employer_contribution";
export type PayrollCalculationMethod = "fixed" | "percentage" | "formula";
export type PayrollComponent = { code: string; name: string; type: PayrollComponentType; method: PayrollCalculationMethod; fixedAmount?: number; percentage?: number; baseCode?: string; taxable?: boolean; proratable?: boolean; statutory?: boolean };
export type PayrollAdjustment = { type: "earning" | "deduction"; code: string; name: string; amount: number };
export type StatutoryInputs = { pf?: { applicable: boolean; employeeRate: number; employerRate: number; wageCeiling?: number }; esi?: { applicable: boolean; employeeRate: number; employerRate: number; wageCeiling?: number }; professionalTax?: { applicable: boolean; amount: number }; tds?: { applicable: boolean; amount: number } };
export type PayrollCalculationInput = { periodStart: string; periodEnd: string; calendarDays: number; workingDays: number; eligibleCalendarDays: number; eligibleWorkingDays: number; payableDays?: number; paidLeaveDays: number; unpaidLeaveDays: number; absentDays: number; lopDays: number; prorationBasis: "calendar_days" | "working_days"; components: PayrollComponent[]; adjustments?: PayrollAdjustment[]; statutory?: StatutoryInputs };
export type PayrollLine = { code: string; name: string; type: PayrollComponentType; amount: number; taxable: boolean; statutory: boolean };
export type PayrollCalculationResult = { calculationVersion: string; calendarDays: number; workingDays: number; payableDays: number; paidLeaveDays: number; unpaidLeaveDays: number; absentDays: number; lopDays: number; grossEarnings: number; totalDeductions: number; statutoryDeductions: number; taxableIncome: number; netSalary: number; employerContributions: number; lines: PayrollLine[]; warnings: string[] };

function money(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
function assertNonNegative(name: string, value: number) { if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number.`); }
export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  for (const [name, value] of Object.entries({ calendarDays: input.calendarDays, workingDays: input.workingDays, eligibleCalendarDays: input.eligibleCalendarDays, eligibleWorkingDays: input.eligibleWorkingDays, paidLeaveDays: input.paidLeaveDays, unpaidLeaveDays: input.unpaidLeaveDays, absentDays: input.absentDays, lopDays: input.lopDays })) assertNonNegative(name, value);
  if (input.prorationBasis === "calendar_days" && input.calendarDays === 0) throw new Error("Calendar days must be greater than zero.");
  if (input.prorationBasis === "working_days" && input.workingDays === 0) throw new Error("Working days must be greater than zero.");
  const basisDays = input.prorationBasis === "calendar_days" ? input.calendarDays : input.workingDays;
  const eligibleBasisDays = input.prorationBasis === "calendar_days" ? input.eligibleCalendarDays : input.eligibleWorkingDays;
  const factor = Math.min(1, eligibleBasisDays / basisDays);
  const payableDays = input.payableDays ?? Math.max(0, eligibleBasisDays - input.lopDays);
  const warnings: string[] = [];
  const lines: PayrollLine[] = [];
  const baseEarnings = input.components.filter((component) => component.type === "earning");
  const values = new Map<string, number>();
  for (const component of baseEarnings) { let amount = component.method === "fixed" ? component.fixedAmount ?? 0 : component.method === "percentage" ? (values.get(component.baseCode ?? "") ?? 0) * (component.percentage ?? 0) / 100 : 0; if (component.method === "formula") warnings.push(`Formula component ${component.code} requires a configured formula evaluator.`); if (component.proratable !== false) amount *= factor; amount = money(amount); values.set(component.code, amount); lines.push({ code: component.code, name: component.name, type: component.type, amount, taxable: component.taxable !== false, statutory: component.statutory === true }); }
  const earnedBeforeLop = money(lines.filter((line) => line.type === "earning").reduce((sum, line) => sum + line.amount, 0));
  const lopAmount = input.lopDays > 0 ? money(earnedBeforeLop * Math.min(1, input.lopDays / Math.max(eligibleBasisDays, 1))) : 0;
  if (lopAmount > 0) lines.push({ code: "LOP", name: "Loss of Pay", type: "deduction", amount: lopAmount, taxable: false, statutory: false });
  for (const adjustment of input.adjustments ?? []) { assertNonNegative(`Adjustment ${adjustment.code}`, adjustment.amount); lines.push({ code: adjustment.code, name: adjustment.name, type: adjustment.type, amount: money(adjustment.amount), taxable: adjustment.type === "earning", statutory: false }); }
  const grossEarnings = money(earnedBeforeLop - lopAmount + lines.filter((line) => line.type === "earning" && line.code !== "LOP").filter((line) => !(baseEarnings.some((component) => component.code === line.code))).reduce((sum, line) => sum + line.amount, 0));
  const earningsForDeductions = grossEarnings;
  for (const component of input.components.filter((item) => item.type === "deduction" || item.type === "employer_contribution")) { let amount = component.method === "fixed" ? component.fixedAmount ?? 0 : component.method === "percentage" ? earningsForDeductions * (component.percentage ?? 0) / 100 : 0; if (component.method === "formula") warnings.push(`Formula component ${component.code} requires a configured formula evaluator.`); if (component.proratable !== false) amount *= factor; lines.push({ code: component.code, name: component.name, type: component.type, amount: money(amount), taxable: component.taxable !== false, statutory: component.statutory === true }); }
  const statutory = input.statutory ?? {};
  const addStatutory = (code: string, name: string, amount: number, type: PayrollComponentType) => { if (amount > 0) lines.push({ code, name, type, amount: money(amount), taxable: false, statutory: true }); };
  const pfBase = Math.min(grossEarnings, statutory.pf?.wageCeiling ?? grossEarnings); if (statutory.pf?.applicable) { addStatutory("PF_EMPLOYEE", "Employee PF", pfBase * statutory.pf.employeeRate / 100, "deduction"); addStatutory("PF_EMPLOYER", "Employer PF", pfBase * statutory.pf.employerRate / 100, "employer_contribution"); }
  const esiBase = Math.min(grossEarnings, statutory.esi?.wageCeiling ?? grossEarnings); if (statutory.esi?.applicable) { addStatutory("ESI_EMPLOYEE", "Employee ESI", esiBase * statutory.esi.employeeRate / 100, "deduction"); addStatutory("ESI_EMPLOYER", "Employer ESI", esiBase * statutory.esi.employerRate / 100, "employer_contribution"); }
  if (statutory.professionalTax?.applicable) addStatutory("PT", "Professional Tax", statutory.professionalTax.amount, "deduction");
  if (statutory.tds?.applicable) addStatutory("TDS", "TDS", statutory.tds.amount, "deduction");
  const totalDeductions = money(lines.filter((line) => line.type === "deduction").reduce((sum, line) => sum + line.amount, 0));
  const employerContributions = money(lines.filter((line) => line.type === "employer_contribution").reduce((sum, line) => sum + line.amount, 0));
  const taxableIncome = money(lines.filter((line) => line.type === "earning" && line.taxable).reduce((sum, line) => sum + line.amount, 0));
  return { calculationVersion: PAYROLL_CALCULATION_VERSION, calendarDays: input.calendarDays, workingDays: input.workingDays, payableDays: money(payableDays), paidLeaveDays: input.paidLeaveDays, unpaidLeaveDays: input.unpaidLeaveDays, absentDays: input.absentDays, lopDays: input.lopDays, grossEarnings, totalDeductions, statutoryDeductions: money(lines.filter((line) => line.type === "deduction" && line.statutory).reduce((sum, line) => sum + line.amount, 0)), taxableIncome, netSalary: money(grossEarnings - totalDeductions), employerContributions, lines, warnings };
}
