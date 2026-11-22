import type{employees}from'$lib/server/schema';
export interface EmployeeDetailsRelational {
  department: {
    id: string;
    name: string;
    code: string;
    status: string;
  } | null;
  designation: {
    id: string;
    name: string;
    code: string;
    level: number | null;
    status: string;
  } | null;
  shift: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    graceMinutes: number;
    overnight: boolean;
    status: string;
  } | null;
  employmentType: {
    id: string;
    name: string;
    code: string;
    status: string;
  } | null;
  reportingManager: {
    id: string;
    displayName: string;
    employeeId: string;
    workEmail: string | null;
  } | null;
  team: {
    id: string;
    name: string;
    code: string;
    status: string;
  } | null;
  location: {
    id: string;
    name: string;
    code: string;
    status: string;
  } | null;
  roleKey: string | null;
  roleTitle: string | null;
}

type JSONDates<T>=T extends Date?string:T extends object?{[K in keyof T]:JSONDates<T[K]>}:T;
export type EmployeeDetails = JSONDates<typeof employees.$inferSelect & EmployeeDetailsRelational>;

