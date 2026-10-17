export interface DepartmentManagerSummary {
  id: string;
  displayName: string;
  employeeId: string;
  workEmail?: string | null;
  phone?: string | null;
  roleKey?: string | null;
  roleTitle?: string | null;
  status: string;
}

export interface DepartmentTeamLeadSummary {
  id: string;
  displayName: string;
  employeeId: string;
  workEmail?: string | null;
  phone?: string | null;
  roleKey?: string | null;
  roleTitle?: string | null;
  status: string;
}

export interface DepartmentListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  headEmployeeId: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  manager: DepartmentManagerSummary | null;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  pendingCount: number;
  onLeaveCount: number;
  subTeamsCount: number;
}

export interface DepartmentRosterMember {
  id: string;
  employeeId: string;
  displayName: string;
  workEmail: string | null;
  phone: string | null;
  roleKey: string | null;
  roleTitle: string | null;
  status: string;
  joiningDate: string | null;
  punchStatus: "present" | "late" | "early_departure" | "late_and_early" | "missing_punch" | "on_leave" | "absent" | "pending_arrival" | "holiday" | "weekend" | "not_joined";
  firstIn: Date | null;
  lastOut: Date | null;
}

export interface DepartmentTeamItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  teamLeadEmployeeId: string | null;
  teamLeadName: string | null;
}

export interface DepartmentDateContext {
  date: string;
  timezone: string;
  isHoliday: boolean;
  holidayName: string | null;
  isWorkingDay: boolean;
  isPastDate: boolean;
  isToday: boolean;
  isFutureDate: boolean;
}

export interface DepartmentDetails extends DepartmentListItem {
  teams: DepartmentTeamItem[];
  roster: DepartmentRosterMember[];
  dateContext: DepartmentDateContext;
  canManageTeams?: boolean;
}

export interface DepartmentTeamInput {
  name: string;
  code: string;
  description?: string | null;
  teamLeadEmployeeId?: string | null;
  status?: "active" | "inactive";
}

export interface DepartmentInput {
  code: string;
  name: string;
  description?: string;
  headEmployeeId?: string | null;
  status?: "active" | "inactive";
}

export interface DepartmentDeletionSafety {
  safe: boolean;
  activeEmployeesCount: number;
  activeTeamsCount: number;
  activeRequisitionsCount: number;
  activeExpensePoliciesCount: number;
  reasons: string[];
}
