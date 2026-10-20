<script lang="ts">
import type{EmployeeDetails}from'$lib/domain/employees/types';import type{CustomSelectOption}from'$lib/components/ui/CustomSelect.svelte';import{getAssignableRoles,ROLE_METADATA,type SystemRole}from'$lib/domain/rbac/permissions';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Input from "$lib/components/ui/Input.svelte";
import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
import {api, mutation} from "$lib/client/api";
interface MasterDataItem {
  id: string;
  name: string;
  code?: string;
  status?: string;
  level?: number;
  departmentId?: string;
  department_id?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  breakMinutes?: number;
  break_minutes?: number;
  graceMinutes?: number;
  grace_minutes?: number;
  overnight?: boolean;
}
interface ManagerSummary {
  id: string;
  displayName: string;
  employeeId: string;
  departmentId?: string | null;
}
interface EditEmployeeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  employee: EmployeeDetails;
  currentUserRole?: string | null;
  currentUserId?: string;
  isOwnerViewer?: boolean;
  onSuccess?: () => void;
}
let {
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  employee,
  currentUserRole,
  isOwnerViewer = false,
  onSuccess,
}:EditEmployeeDialogProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let internalOpen=$state(untrack(()=>(false)));
const setInternalOpen=(next:typeof internalOpen|((previous:typeof internalOpen)=>typeof internalOpen))=>{internalOpen=typeof next==="function"?(next as (previous:typeof internalOpen)=>typeof internalOpen)(internalOpen):next;};
const isControlled=$derived(controlledOpen !== undefined);
const isOpen=$derived(isControlled ? controlledOpen : internalOpen);
const setOpen = (next: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };
const isOwner=$derived(isOwnerViewer || currentUserRole === "ORGANIZATION_OWNER");
const isTargetOwner=$derived(employee.roleKey === "ORGANIZATION_OWNER");
const assignableRoles=$derived(getAssignableRoles(isOwner ? "ORGANIZATION_OWNER" : currentUserRole));
let firstName=$state(untrack(()=>(employee.firstName ?? "")));
const setFirstName=(next:typeof firstName|((previous:typeof firstName)=>typeof firstName))=>{firstName=typeof next==="function"?(next as (previous:typeof firstName)=>typeof firstName)(firstName):next;};
let middleName=$state(untrack(()=>(employee.middleName ?? "")));
const setMiddleName=(next:typeof middleName|((previous:typeof middleName)=>typeof middleName))=>{middleName=typeof next==="function"?(next as (previous:typeof middleName)=>typeof middleName)(middleName):next;};
let lastName=$state(untrack(()=>(employee.lastName ?? "")));
const setLastName=(next:typeof lastName|((previous:typeof lastName)=>typeof lastName))=>{lastName=typeof next==="function"?(next as (previous:typeof lastName)=>typeof lastName)(lastName):next;};
let personalEmail=$state(untrack(()=>(employee.personalEmail ?? "")));
const setPersonalEmail=(next:typeof personalEmail|((previous:typeof personalEmail)=>typeof personalEmail))=>{personalEmail=typeof next==="function"?(next as (previous:typeof personalEmail)=>typeof personalEmail)(personalEmail):next;};
let workEmail=$state(untrack(()=>(employee.workEmail ?? "")));
const setWorkEmail=(next:typeof workEmail|((previous:typeof workEmail)=>typeof workEmail))=>{workEmail=typeof next==="function"?(next as (previous:typeof workEmail)=>typeof workEmail)(workEmail):next;};
let phone=$state(untrack(()=>(employee.phone ?? "")));
const setPhone=(next:typeof phone|((previous:typeof phone)=>typeof phone))=>{phone=typeof next==="function"?(next as (previous:typeof phone)=>typeof phone)(phone):next;};
let city=$state(untrack(()=>(employee.city ?? "")));
const setCity=(next:typeof city|((previous:typeof city)=>typeof city))=>{city=typeof next==="function"?(next as (previous:typeof city)=>typeof city)(city):next;};
let addressLine1=$state(untrack(()=>(employee.addressLine1 ?? "")));
const setAddressLine1=(next:typeof addressLine1|((previous:typeof addressLine1)=>typeof addressLine1))=>{addressLine1=typeof next==="function"?(next as (previous:typeof addressLine1)=>typeof addressLine1)(addressLine1):next;};
let joiningDate=$state(untrack(()=>(employee.joiningDate ?? "")));
const setJoiningDate=(next:typeof joiningDate|((previous:typeof joiningDate)=>typeof joiningDate))=>{joiningDate=typeof next==="function"?(next as (previous:typeof joiningDate)=>typeof joiningDate)(joiningDate):next;};
let departmentId=$state(untrack(()=>(employee.departmentId ?? "")));
const setDepartmentId=(next:typeof departmentId|((previous:typeof departmentId)=>typeof departmentId))=>{departmentId=typeof next==="function"?(next as (previous:typeof departmentId)=>typeof departmentId)(departmentId):next;};
let designationId=$state(untrack(()=>(employee.designationId ?? "")));
const setDesignationId=(next:typeof designationId|((previous:typeof designationId)=>typeof designationId))=>{designationId=typeof next==="function"?(next as (previous:typeof designationId)=>typeof designationId)(designationId):next;};
let targetRole=$state(untrack(()=>(employee.roleKey ?? "EMPLOYEE")));
const setTargetRole=(next:typeof targetRole|((previous:typeof targetRole)=>typeof targetRole))=>{targetRole=typeof next==="function"?(next as (previous:typeof targetRole)=>typeof targetRole)(targetRole):next;};
let shiftId=$state(untrack(()=>(employee.shiftId ?? "")));
const setShiftId=(next:typeof shiftId|((previous:typeof shiftId)=>typeof shiftId))=>{shiftId=typeof next==="function"?(next as (previous:typeof shiftId)=>typeof shiftId)(shiftId):next;};
let employmentTypeId=$state(untrack(()=>(employee.employmentTypeId ?? "")));
const setEmploymentTypeId=(next:typeof employmentTypeId|((previous:typeof employmentTypeId)=>typeof employmentTypeId))=>{employmentTypeId=typeof next==="function"?(next as (previous:typeof employmentTypeId)=>typeof employmentTypeId)(employmentTypeId):next;};
let reportingManagerId=$state(untrack(()=>(employee.reportingManagerId ?? "")));
const setReportingManagerId=(next:typeof reportingManagerId|((previous:typeof reportingManagerId)=>typeof reportingManagerId))=>{reportingManagerId=typeof next==="function"?(next as (previous:typeof reportingManagerId)=>typeof reportingManagerId)(reportingManagerId):next;};
let teamId=$state(untrack(()=>(employee.teamId ?? "")));
const setTeamId=(next:typeof teamId|((previous:typeof teamId)=>typeof teamId))=>{teamId=typeof next==="function"?(next as (previous:typeof teamId)=>typeof teamId)(teamId):next;};
let locationId=$state(untrack(()=>(employee.locationId ?? "")));
const setLocationId=(next:typeof locationId|((previous:typeof locationId)=>typeof locationId))=>{locationId=typeof next==="function"?(next as (previous:typeof locationId)=>typeof locationId)(locationId):next;};
let status=$state(untrack(()=>(employee.status ?? "active")));
const setStatus=(next:typeof status|((previous:typeof status)=>typeof status))=>{status=typeof next==="function"?(next as (previous:typeof status)=>typeof status)(status):next;};
let departments=$state<MasterDataItem[]>(untrack(()=>([])));
const setDepartments=(next:typeof departments|((previous:typeof departments)=>typeof departments))=>{departments=typeof next==="function"?(next as (previous:typeof departments)=>typeof departments)(departments):next;};
let designations=$state<MasterDataItem[]>(untrack(()=>([])));
const setDesignations=(next:typeof designations|((previous:typeof designations)=>typeof designations))=>{designations=typeof next==="function"?(next as (previous:typeof designations)=>typeof designations)(designations):next;};
let shifts=$state<MasterDataItem[]>(untrack(()=>([])));
const setShifts=(next:typeof shifts|((previous:typeof shifts)=>typeof shifts))=>{shifts=typeof next==="function"?(next as (previous:typeof shifts)=>typeof shifts)(shifts):next;};
let employmentTypes=$state<MasterDataItem[]>(untrack(()=>([])));
const setEmploymentTypes=(next:typeof employmentTypes|((previous:typeof employmentTypes)=>typeof employmentTypes))=>{employmentTypes=typeof next==="function"?(next as (previous:typeof employmentTypes)=>typeof employmentTypes)(employmentTypes):next;};
let locations=$state<MasterDataItem[]>(untrack(()=>([])));
const setLocations=(next:typeof locations|((previous:typeof locations)=>typeof locations))=>{locations=typeof next==="function"?(next as (previous:typeof locations)=>typeof locations)(locations):next;};
let managers=$state<ManagerSummary[]>(untrack(()=>([])));
const setManagers=(next:typeof managers|((previous:typeof managers)=>typeof managers))=>{managers=typeof next==="function"?(next as (previous:typeof managers)=>typeof managers)(managers):next;};
let teams=$state<MasterDataItem[]>(untrack(()=>([])));
const setTeams=(next:typeof teams|((previous:typeof teams)=>typeof teams))=>{teams=typeof next==="function"?(next as (previous:typeof teams)=>typeof teams)(teams):next;};
let isLoadingMasterData=$state(untrack(()=>(false)));
const setIsLoadingMasterData=(next:typeof isLoadingMasterData|((previous:typeof isLoadingMasterData)=>typeof isLoadingMasterData))=>{isLoadingMasterData=typeof next==="function"?(next as (previous:typeof isLoadingMasterData)=>typeof isLoadingMasterData)(isLoadingMasterData):next;};
let isSubmitting=$state(untrack(()=>(false)));
const setIsSubmitting=(next:typeof isSubmitting|((previous:typeof isSubmitting)=>typeof isSubmitting))=>{isSubmitting=typeof next==="function"?(next as (previous:typeof isSubmitting)=>typeof isSubmitting)(isSubmitting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{isOpen;employee;return untrack(() => {
    if (isOpen) {
      setFirstName(employee.firstName ?? "");
      setMiddleName(employee.middleName ?? "");
      setLastName(employee.lastName ?? "");
      setPersonalEmail(employee.personalEmail ?? "");
      setWorkEmail(employee.workEmail ?? "");
      setPhone(employee.phone ?? "");
      setCity(employee.city ?? "");
      setAddressLine1(employee.addressLine1 ?? "");
      setJoiningDate(employee.joiningDate ?? "");

      setDepartmentId(employee.departmentId ?? "");
      setDesignationId(employee.designationId ?? "");
      setTargetRole(employee.roleKey ?? "EMPLOYEE");
      setShiftId(employee.shiftId ?? "");
      setEmploymentTypeId(employee.employmentTypeId ?? "");
      setReportingManagerId(employee.reportingManagerId ?? "");
      setTeamId(employee.teamId ?? "");
      setLocationId(employee.locationId ?? "");
      setStatus(employee.status ?? "active");
      setError(null);
    }
  });});
$effect(()=>{isOpen;employee.id;return untrack(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setIsLoadingMasterData(true);
      try {
        const [deptRes, desigRes, shiftRes, typeRes, locRes, empRes] = await Promise.allSettled([
          api<{ items: MasterDataItem[] }>("/api/app/master-data/departments"),
          api<{ items: MasterDataItem[] }>("/api/app/master-data/designations"),
          api<{ items: MasterDataItem[] }>("/api/app/master-data/shifts"),
          api<{ items: MasterDataItem[] }>("/api/app/master-data/employment-types"),
          api<{ items: MasterDataItem[] }>("/api/app/master-data/locations"),
          api<{ rows: { id: string; displayName: string; employeeId: string; departmentId?: string | null }[] }>("/api/app/employees?pageSize=100"),
        ]);

        if (!isMounted) return;

        if (deptRes.status === "fulfilled" && deptRes.value.items) {
          setDepartments(deptRes.value.items);
        }
        if (desigRes.status === "fulfilled" && desigRes.value.items) {
          setDesignations(desigRes.value.items);
        }
        if (shiftRes.status === "fulfilled" && shiftRes.value.items) {
          setShifts(shiftRes.value.items);
        }
        if (typeRes.status === "fulfilled" && typeRes.value.items) {
          setEmploymentTypes(typeRes.value.items);
        }
        if (locRes.status === "fulfilled" && locRes.value.items) {
          setLocations(locRes.value.items);
        }
        if (empRes.status === "fulfilled" && empRes.value.rows) {
          setManagers(
            (empRes.value.rows as { id: string; displayName: string; employeeId: string; departmentId?: string | null }[])
              .filter((m) => m.id !== employee.id)
              .map((m) => ({
                id: m.id,
                displayName: m.displayName,
                employeeId: m.employeeId,
                departmentId: m.departmentId,
              }))
          );
        }
      } catch {
        // Fallback gracefully to existing employee relations
      } finally {
        if (isMounted) setIsLoadingMasterData(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  });});
$effect(()=>{departmentId;isOpen;return untrack(() => {
    if (!departmentId || !isOpen) {
      setTeams([]);
      return;
    }

    let isMounted = true;
    async function loadTeams() {
      try {
        const data = await api<{ items: MasterDataItem[] }>(`/api/app/master-data/teams?departmentId=${encodeURIComponent(departmentId)}`);
        if (isMounted && data.items) {
          setTeams(data.items);
        }
      } catch {
        if (isMounted) setTeams([]);
      }
    }

    loadTeams();
    return () => {
      isMounted = false;
    };
  });});
const isSelectedRoleHr=$derived(targetRole === "HR_ADMIN" || targetRole === "HR_EXECUTIVE");
const hrDepartments=$derived(departments.filter(isHrDepartment));
$effect(()=>{isSelectedRoleHr;teamId;locationId;departmentId;departments;hrDepartments;return untrack(() => {
    if (isSelectedRoleHr) {
      if (teamId) setTeamId("");
      if (locationId) setLocationId("");
      if (departmentId && hrDepartments.length > 0) {
        const currentDept = departments.find((d) => d.id === departmentId);
        if (currentDept && !isHrDepartment(currentDept)) {
          setDepartmentId(hrDepartments[0]?.id || "");
        }
      }
    }
  });});
const selectedShift=$derived(shifts.find((s) => s.id === shiftId) ?? employee.shift);
const rawShift=$derived(selectedShift as (MasterDataItem & { startTime?: string; endTime?: string; breakMinutes?: number; graceMinutes?: number }) | null);
const shiftStartTime=$derived(rawShift?.startTime ?? rawShift?.start_time);
const shiftEndTime=$derived(rawShift?.endTime ?? rawShift?.end_time);
const shiftBreak=$derived(rawShift?.breakMinutes ?? rawShift?.break_minutes);
const shiftGrace=$derived(rawShift?.graceMinutes ?? rawShift?.grace_minutes);
const shiftOvernight=$derived(Boolean(rawShift?.overnight));
const availableDepartments=$derived(isSelectedRoleHr && hrDepartments.length > 0 ? hrDepartments : departments);
const departmentOptions:CustomSelectOption[]=$derived(availableDepartments.map((d) => ({
    value: d.id,
    label: d.name,
    sublabel: d.code ? `${d.code}${d.status === "inactive" ? " (Inactive)" : ""}` : undefined,
  })));
const designationOptions:CustomSelectOption[]=$derived(designations.map((d) => ({
    value: d.id,
    label: d.name,
    sublabel: d.code ? `${d.code}${d.level !== undefined ? ` • L${d.level}` : ""}` : undefined,
  })));
const shiftOptions:CustomSelectOption[]=$derived(shifts.map((s) => {
    const sStart = s.startTime ?? s.start_time;
    const sEnd = s.endTime ?? s.end_time;
    const timeSnippet = sStart && sEnd ? ` (${sStart.slice(0, 5)} - ${sEnd.slice(0, 5)})` : "";
    return {
      value: s.id,
      label: `${s.name}${timeSnippet}`,
      sublabel: s.code ?? undefined,
    };
  }));
const employmentTypeOptions:CustomSelectOption[]=$derived(employmentTypes.map((et) => ({
    value: et.id,
    label: et.name,
    sublabel: et.code ?? undefined,
  })));
const locationOptions:CustomSelectOption[]=$derived([
    { value: "", label: "No specific location" },
    ...locations.map((l) => ({ value: l.id, label: l.name, sublabel: l.code ?? undefined })),
  ]);
const teamOptions:CustomSelectOption[]=$derived([
    { value: "", label: "Not assigned to a team" },
    ...teams.map((t) => ({ value: t.id, label: t.name, sublabel: t.code ?? undefined })),
  ]);
const managerOptions:CustomSelectOption[]=$derived([
    { value: "", label: "Not assigned (Reports to executive leadership)" },
    ...managers.map((m) => ({
      value: m.id,
      label: m.displayName,
      sublabel: `ID: ${m.employeeId}`,
    })),
  ]);
const availableRoleKeys=$derived.by(()=>{const availableRoleKeys:SystemRole[]=isTargetOwner
    ? ["ORGANIZATION_OWNER" as SystemRole]
    : assignableRoles.length > 0
      ? [...assignableRoles]
      : (([targetRole as SystemRole].filter(Boolean) as SystemRole[]));if (targetRole && !availableRoleKeys.includes(targetRole as SystemRole)) {
    availableRoleKeys.push(targetRole as SystemRole);
  };return availableRoleKeys;});
const roleOptions:CustomSelectOption[]=$derived(availableRoleKeys.map((rKey) => {
    const meta = ROLE_METADATA[rKey];
    return {
      value: rKey,
      label: meta?.title || rKey,
      sublabel: rKey,
      disabled: isTargetOwner || (!isOwner && !assignableRoles.includes(rKey)),
    };
  }));
const statusOptions:CustomSelectOption[]=$derived([
    { value: "active", label: "Active" },
    { value: "onboarding", label: "Onboarding" },
    { value: "probation", label: "Probation" },
    { value: "confirmed", label: "Confirmed" },
    { value: "notice_period", label: "Notice Period" },
    { value: "inactive", label: "Inactive" },
    { value: "resigned", label: "Resigned" },
    { value: "terminated", label: "Terminated" },
    { value: "invited", label: "Invited" },
  ]);
const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName) {
      setError("First name is required.");
      return;
    }
    if (!cleanLastName) {
      setError("Last name is required.");
      return;
    }

    if (isSelectedRoleHr && departmentId) {
      const selectedDept = departments.find((d) => d.id === departmentId);
      if (selectedDept && !isHrDepartment(selectedDept)) {
        setError("HR personnel must be assigned to an active Human Resources (HR) department.");
        return;
      }
    }

    if (isSelectedRoleHr && teamId) {
      setError("Team assignments are not permitted for HR personnel.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        firstName: cleanFirstName,
        middleName: middleName.trim() || undefined,
        lastName: cleanLastName,
        personalEmail: personalEmail.trim() || undefined,
        workEmail: workEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        joiningDate: joiningDate || undefined,
        departmentId: departmentId || undefined,
        designationId: designationId || undefined,
        shiftId: shiftId || undefined,
        employmentTypeId: employmentTypeId || undefined,
        reportingManagerId: reportingManagerId ? reportingManagerId : null,
        teamId: isSelectedRoleHr ? null : (teamId ? teamId : null),
        locationId: isSelectedRoleHr ? null : (locationId ? locationId : null),
        status,
      };

      // Only include targetRole if it changed and actor is authorized
      if (!isTargetOwner && targetRole && targetRole !== employee.roleKey) {
        payload.targetRole = targetRole;
      }

      await mutation(`/api/app/employees/${employee.id}`, "PATCH", payload);

      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update employee details.");
    } finally {
      setIsSubmitting(false);
    }
  };
</script>

      {#if !isControlled}<Button type="button" onclick={() => setOpen(true)} class="gap-2 font-semibold shadow-xs transition-colors" size="sm">
          <SvgIcon name="Edit3" class="size-3.5" />
          <span>Edit Employee</span>
        </Button>{/if}

      <DialogFrame open={Boolean(isOpen)} onOpenChange={(next) => !isSubmitting && setOpen(next)}>
        
          

          <div class="fixed left-1/2 top-1/2 z-[100] flex max-h-[90vh] sm:max-h-[85vh] w-[95vw] sm:w-[90vw] max-w-2xl lg:max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/80 bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden">
            
            <div class="flex shrink-0 items-center justify-between border-b border-border/60 bg-white px-5 py-3.5 sm:px-6">
              <div class="flex items-center gap-3">
                <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <SvgIcon name="Edit3" class="size-4.5" />
                </div>
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-foreground">
                    Edit Employee Profile
                  </h2>
                  <p class="text-xs text-muted">
                    {employee.displayName} • ID: <span class="font-mono">{employee.employeeId}</span>
                  </p>
                </div>
              </div>

              
                <button type="button" disabled={isSubmitting} onclick={() => setOpen(false)} class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 transition-colors" aria-label="Close">
                  <SvgIcon name="X" class="size-4" />
                </button>
              
            </div>

            
            <form onsubmit={handleSubmit} class="flex flex-1 flex-col min-h-0 overflow-hidden">
              <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4 sm:px-6 space-y-4.5">
                
                {#if error}<div role="alert" class="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <SvgIcon name="AlertCircle" class="size-4 shrink-0 text-rose-600 mt-0.5" />
                    <p class="font-medium leading-relaxed">{error}</p>
                  </div>{/if}

                
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <SvgIcon name="User" class="size-3.5 text-primary" />
                    <span>Personal Details & Contact</span>
                  </div>

                  
                  <div class="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <div>
                      <label for="edit-employee-field-1" class="block text-xs font-semibold text-foreground mb-1">
                        First Name <span class="text-rose-500">*</span>
                      </label>
                      <Input id="edit-employee-field-1" type="text" value={firstName} oninput={(e) => setFirstName(e.currentTarget.value)} required placeholder="e.g. Eleanor" class="h-9 text-xs" />
                    </div>

                    <div>
                      <label for="edit-employee-field-2" class="block text-xs font-semibold text-foreground mb-1">
                        Middle Name
                      </label>
                      <Input id="edit-employee-field-2" type="text" value={middleName} oninput={(e) => setMiddleName(e.currentTarget.value)} placeholder="Optional" class="h-9 text-xs" />
                    </div>

                    <div>
                      <label for="edit-employee-field-3" class="block text-xs font-semibold text-foreground mb-1">
                        Last Name <span class="text-rose-500">*</span>
                      </label>
                      <Input id="edit-employee-field-3" type="text" value={lastName} oninput={(e) => setLastName(e.currentTarget.value)} required placeholder="e.g. Vance" class="h-9 text-xs" />
                    </div>
                  </div>

                  
                  <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label for="edit-employee-field-4" class="block text-xs font-semibold text-foreground mb-1">
                        Work Email
                      </label>
                      <Input id="edit-employee-field-4" type="email" value={workEmail} oninput={(e) => setWorkEmail(e.currentTarget.value)} placeholder="work@organization.com" class="h-9 text-xs font-mono" />
                    </div>

                    <div>
                      <label for="edit-employee-field-5" class="block text-xs font-semibold text-foreground mb-1">
                        Personal Email
                      </label>
                      <Input id="edit-employee-field-5" type="email" value={personalEmail} oninput={(e) => setPersonalEmail(e.currentTarget.value)} placeholder="personal@domain.com" class="h-9 text-xs font-mono" />
                    </div>
                  </div>

                  
                  <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label for="edit-employee-field-6" class="block text-xs font-semibold text-foreground mb-1">
                        Phone Number
                      </label>
                      <Input id="edit-employee-field-6" type="tel" value={phone} oninput={(e) => setPhone(e.currentTarget.value)} placeholder="+1 (555) 012-3456" class="h-9 text-xs" />
                    </div>

                    <div>
                      <label for="edit-employee-field-7" class="block text-xs font-semibold text-foreground mb-1">
                        Location / City
                      </label>
                      <Input id="edit-employee-field-7" type="text" value={city} oninput={(e) => setCity(e.currentTarget.value)} placeholder="e.g. San Francisco, CA" class="h-9 text-xs" />
                    </div>
                  </div>

                  
                  <div>
                    <label for="edit-employee-field-8" class="block text-xs font-semibold text-foreground mb-1">
                      Residential Address
                    </label>
                    <Input id="edit-employee-field-8" type="text" value={addressLine1} oninput={(e) => setAddressLine1(e.currentTarget.value)} placeholder="Street address" class="h-9 text-xs" />
                  </div>
                </div>

                
                <div class="space-y-3 border-t border-slate-100 pt-4">
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <SvgIcon name="Building2" class="size-3.5 text-primary" />
                    <span>Organizational Hierarchy & Placement</span>
                  </div>

                  <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label for="edit-employee-field-9" class="block text-xs font-semibold text-foreground mb-1">
                        Department
                      </label>
                      <CustomSelect id="edit-employee-field-9" value={departmentId} onChange={(val) => {
                          setDepartmentId(val);
                          setTeamId("");
                        }} options={departmentOptions} placeholder={isLoadingMasterData ? "Loading departments…" : "Select Department"} searchable disabled={isLoadingMasterData} />
                      {#if isSelectedRoleHr}<p class="mt-1 text-[11px] text-amber-700 font-medium">
                          HR roles must be assigned to an active Human Resources department.
                        </p>{/if}
                    </div>

                    <div>
                      <label for="edit-employee-field-10" class="block text-xs font-semibold text-foreground mb-1">
                        Designation / Job Title
                      </label>
                      <CustomSelect id="edit-employee-field-10" value={designationId} onChange={setDesignationId} options={designationOptions} placeholder={isLoadingMasterData ? "Loading designations…" : "Select Designation"} searchable disabled={isLoadingMasterData} />
                    </div>
                  </div>

                  <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label for="edit-employee-system-role" class="block text-xs font-semibold text-foreground">
                          System Role (RBAC)
                        </label>
                        {#if isTargetOwner}<span class="flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                            <SvgIcon name="Lock" class="size-3" />
                            Owner Protected
                          </span>{/if}
                      </div>
                      <CustomSelect id="edit-employee-system-role" value={targetRole} onChange={setTargetRole} options={roleOptions} placeholder="Select System Role" disabled={isTargetOwner || roleOptions.length <= 1} />
                      <p class="mt-1 text-[10px] text-muted">
                        {#if isTargetOwner}{"The Organization Owner role is protected and cannot be changed."}{:else}{#if currentUserRole === "ORGANIZATION_OWNER"}{"As Organization Owner, you can assign roles across executive and staff levels."}{:else}{"Role changes are restricted to roles you are authorized to assign."}{/if}{/if}
                      </p>
                    </div>

                    <div>
                      <label for="edit-employee-field-11" class="block text-xs font-semibold text-foreground mb-1">
                        Employment Type
                      </label>
                      <CustomSelect id="edit-employee-field-11" value={employmentTypeId} onChange={setEmploymentTypeId} options={employmentTypeOptions} placeholder={isLoadingMasterData ? "Loading types…" : "Select Employment Type"} disabled={isLoadingMasterData} />
                    </div>
                  </div>

                  <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label for="edit-employee-field-12" class="block text-xs font-semibold text-foreground mb-1">
                        Reporting Manager
                      </label>
                      <CustomSelect id="edit-employee-field-12" value={reportingManagerId} onChange={setReportingManagerId} options={managerOptions} placeholder="Select Reporting Manager" searchable />
                    </div>

                    
                    {#if isSelectedRoleHr}<div class="flex flex-col justify-end">
                        <div class="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
                          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <SvgIcon name="ShieldCheck" class="size-3.5 text-slate-500" />
                            <span>Team Assignment</span>
                          </div>
                          <p class="mt-1 text-[11px] text-muted leading-tight">
                            Team selection is disabled for HR roles by organization policy.
                          </p>
                        </div>
                      </div>{:else}<div>
                        <label for="edit-employee-field-13" class="block text-xs font-semibold text-foreground mb-1">
                          Team / Squad
                        </label>
                        <CustomSelect id="edit-employee-field-13" value={teamId} onChange={setTeamId} options={teamOptions} placeholder={!departmentId
                              ? "Select a department first"
                              : teamOptions.length <= 1
                                ? "No teams in this department"
                                : "Select Team"} disabled={!departmentId || teamOptions.length <= 1} />
                      </div>{/if}
                  </div>

                  
                  {#if !isSelectedRoleHr}<div>
                      <label for="edit-employee-field-14" class="block text-xs font-semibold text-foreground mb-1">
                        Work Location / Office
                      </label>
                      <CustomSelect id="edit-employee-field-14" value={locationId} onChange={setLocationId} options={locationOptions} placeholder="Select Office Location" />
                    </div>{/if}
                </div>

                
                <div class="space-y-3 border-t border-slate-100 pt-4">
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <SvgIcon name="Clock" class="size-3.5 text-primary" />
                    <span>Work Shift & Schedule Assignment</span>
                  </div>

                  <div>
                    <label for="edit-employee-field-15" class="block text-xs font-semibold text-foreground mb-1">
                      Assigned Shift
                    </label>
                    <CustomSelect id="edit-employee-field-15" value={shiftId} onChange={setShiftId} options={shiftOptions} placeholder={isLoadingMasterData ? "Loading shifts…" : "Select Assigned Shift"} searchable disabled={isLoadingMasterData} />
                  </div>

                  
                  {#if selectedShift}<div class="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs space-y-2">
                      <div class="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span class="font-semibold text-foreground">{selectedShift.name}</span>
                        {#if shiftOvernight}<span class="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                            <SvgIcon name="Moon" class="size-3" />
                            Overnight Shift
                          </span>{:else}<span class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <SvgIcon name="Sun" class="size-3 text-emerald-600" />
                            Daytime Shift
                          </span>{/if}
                      </div>
                      <div class="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span class="text-muted block text-[10px]">Schedule</span>
                          <span class="font-mono font-semibold text-foreground">
                            {#if shiftStartTime && shiftEndTime}{`${shiftStartTime.slice(0, 5)} – ${shiftEndTime.slice(0, 5)}`}{:else}{"—"}{/if}
                          </span>
                        </div>
                        <div>
                          <span class="text-muted block text-[10px]">Break Duration</span>
                          <span class="font-medium text-slate-800">
                            {#if shiftBreak !== undefined && shiftBreak !== null}{`${shiftBreak} mins`}{:else}{"—"}{/if}
                          </span>
                        </div>
                        <div>
                          <span class="text-muted block text-[10px]">Grace Buffer</span>
                          <span class="font-medium text-slate-800">
                            {#if shiftGrace !== undefined && shiftGrace !== null}{`${shiftGrace} mins`}{:else}{"—"}{/if}
                          </span>
                        </div>
                      </div>
                    </div>{/if}
                </div>

                
                <div class="space-y-3 border-t border-slate-100 pt-4">
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                    <SvgIcon name="Calendar" class="size-3.5 text-primary" />
                    <span>Employment Lifecycle & Status</span>
                  </div>

                  <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label for="edit-employee-field-16" class="block text-xs font-semibold text-foreground mb-1">
                        Joining Date
                      </label>
                      <Input id="edit-employee-field-16" type="date" value={joiningDate} oninput={(e) => setJoiningDate(e.currentTarget.value)} class="h-9 text-xs" />
                    </div>

                    <div>
                      <label for="edit-employee-field-17" class="block text-xs font-semibold text-foreground mb-1">
                        Account / Lifecycle Status
                      </label>
                      <CustomSelect id="edit-employee-field-17" value={status} onChange={(val) => setStatus(val as typeof employee.status)} options={statusOptions} placeholder="Select Status" />
                    </div>
                  </div>
                </div>
              </div>

              
              <div class="flex shrink-0 items-center justify-end gap-3 border-t border-border/60 bg-slate-50/90 px-5 py-3 sm:px-6 backdrop-blur-xs">
                <Button type="button" variant="outline" onclick={() => setOpen(false)} disabled={isSubmitting} class="text-xs">
                  Cancel
                </Button>

                <Button type="submit" disabled={isSubmitting} class="gap-2 text-xs font-semibold bg-primary text-white hover:bg-primary/90">
                  {#if isSubmitting}
                      <SvgIcon name="Loader2" class="size-3.5 animate-spin" />
                      <span>Saving Changes…</span>
                    {:else}<span>Save Changes</span>{/if}
                </Button>
              </div>
            </form>
          </div>
        
      </DialogFrame>
    
