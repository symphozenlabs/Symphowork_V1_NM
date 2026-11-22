<script lang="ts">
let{data}=$props();const employee=$derived(data.employee);const canInvite=$derived(data.canInvite);const canOnboard=$derived(data.canOnboard);const canReadAttendance=$derived(data.canReadAttendance);const canUpdate=$derived(data.canUpdate);const isOwnerViewer=$derived(data.isOwnerViewer);const history=$derived(data.history);const tenant=$derived(data.tenant);const user=$derived(data.user);const isOwnerRecord=$derived(data.isOwnerRecord);  const statusMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
    onboarding: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
    suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
    terminated: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
    invited: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
    probation: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200" },
    confirmed: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", border: "border-teal-200" },
    notice_period: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
    inactive: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  };

const currentTheme=$derived(statusMap[employee.status]||statusMap.active);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import EditEmployeeDialog from "$lib/components/employees/EditEmployeeDialog.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import EmployeeInvitationActions from "$lib/components/employees/EmployeeInvitationActions.svelte";
import OnboardingChecklist from "$lib/components/employees/OnboardingChecklist.svelte";

</script>
<div class="w-full space-y-5">
      
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a href="/app/employees" class="group inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
          <SvgIcon name="ArrowLeft" class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-600" />
          <span>Back to Employee Directory</span>
        </a>

        
        <div class="flex items-center gap-2 flex-wrap shrink-0">
          {#if canUpdate}<EditEmployeeDialog employee={employee} currentUserRole={tenant.role?.key} currentUserId={user.id} isOwnerViewer={isOwnerViewer} />{/if}

          {#if canReadAttendance}<LinkButton variant="outline" size="sm" class="h-9 gap-1.5 font-semibold text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs" href={`/app/attendance?employeeId=${employee.id}`}>
                <SvgIcon name="Clock" class="h-3.5 w-3.5 text-primary" />
                <span>Attendance History</span>
              </LinkButton>{/if}

          {#if isOwnerRecord && !isOwnerViewer}<span class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200/90 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 shadow-2xs">
              <SvgIcon name="ShieldCheck" class="h-3.5 w-3.5 text-emerald-600" />
              Protected Organization Owner
            </span>{:else}{#if canInvite && employee.status !== "active"}<EmployeeInvitationActions employeeId={employee.id} email={employee.personalEmail ?? employee.workEmail} status={employee.status} />{/if}{/if}
        </div>
      </div>

      
      <div class="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-400"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
          <div class="flex items-start sm:items-center gap-4 min-w-0">
            
            <div class="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E4D2B] via-primary to-[#2C6E3B] text-white shadow-sm font-bold text-lg sm:text-xl select-none ring-4 ring-emerald-50">
              {employee.displayName.slice(0, 2).toUpperCase()}
            </div>

            <div class="space-y-1.5 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {employee.displayName}
                </h1>

                <span class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shrink-0`}>
                  <span class={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`}></span>
                  {employee.status.toUpperCase()}
                </span>

                <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-700 font-medium shrink-0">
                  ID: {employee.employeeId}
                </span>

                {#if employee.roleTitle}<span class="inline-flex items-center gap-1 rounded-md border border-indigo-200/80 bg-indigo-50/80 px-2 py-0.5 text-xs font-semibold text-indigo-700 shrink-0">
                    <SvgIcon name="ShieldCheck" class="h-3.5 w-3.5 text-indigo-600" />
                    <span>{employee.roleTitle}</span>
                  </span>{/if}
              </div>

              
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span class="inline-flex items-center gap-1 font-mono text-slate-600 truncate max-w-xs" title={employee.workEmail ?? employee.personalEmail ?? ""}>
                  <SvgIcon name="Mail" class="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {employee.workEmail ?? employee.personalEmail ?? "No email registered"}
                </span>

                {#if employee.department}
                    <span class="text-slate-300">•</span>
                    <span class="inline-flex items-center gap-1 text-slate-600 font-medium truncate">
                      <SvgIcon name="Briefcase" class="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {employee.department.name}
                    </span>
                  {/if}

                {#if employee.designation}
                    <span class="text-slate-300">•</span>
                    <span class="text-slate-600 font-medium truncate">
                      {employee.designation.name}
                    </span>
                  {/if}

                {#if employee.reportingManager}
                    <span class="text-slate-300">•</span>
                    <span class="text-slate-600 truncate" title={`Manager: ${employee.reportingManager.displayName}`}>
                      Manager: <span class="font-medium text-slate-800">{employee.reportingManager.displayName}</span>
                    </span>
                  {/if}
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        <div class="lg:col-span-7 xl:col-span-8 space-y-5">
          
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <SvgIcon name="Briefcase" class="h-4 w-4" />
                </div>
                <div>
                  <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Employment &amp; Organizational Details
                  </h2>
                  <p class="text-[11px] text-slate-400">Position, reporting line, and organizational structure</p>
                </div>
              </div>
            </div>

            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-3.5 text-xs">
              
              <div class="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">Department</span>
                <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span class="font-semibold text-slate-800 truncate" title={employee.department?.name ?? ""}>
                    {#if employee.department}{employee.department.name}{:else}{"Not assigned"}{/if}
                  </span>
                  {#if employee.department?.code}<span class="rounded bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-medium shrink-0">
                      {employee.department.code}
                    </span>{/if}
                  {#if employee.department?.status === "inactive"}<span class="rounded bg-amber-50 border border-amber-200/70 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">
                      (Inactive)
                    </span>{/if}
                </div>
              </div>

              
              <div class="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">Designation</span>
                <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span class="font-semibold text-slate-800 truncate" title={employee.designation?.name ?? ""}>
                    {#if employee.designation}{employee.designation.name}{:else}{"Not assigned"}{/if}
                  </span>
                  {#if employee.designation?.code}<span class="rounded bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-medium shrink-0">
                      {employee.designation.code}
                    </span>{/if}
                  {#if employee.designation?.level !== null && employee.designation?.level !== undefined}<span class="rounded bg-blue-50 border border-blue-200/70 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">
                      Level {employee.designation.level}
                    </span>{/if}
                </div>
              </div>

              
              <div class="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">System Role</span>
                <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span class="font-semibold text-slate-800 truncate">
                    {employee.roleTitle || "Employee"}
                  </span>
                  <span class="rounded-md border border-indigo-200/80 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700 shrink-0">
                    {employee.roleKey || "EMPLOYEE"}
                  </span>
                </div>
              </div>

              
              <div class="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">Employment Type</span>
                <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span class="font-semibold text-slate-800 truncate" title={employee.employmentType?.name ?? ""}>
                    {#if employee.employmentType}{employee.employmentType.name}{:else}{"Not assigned"}{/if}
                  </span>
                  {#if employee.employmentType?.code}<span class="rounded bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-medium shrink-0">
                      {employee.employmentType.code}
                    </span>{/if}
                </div>
              </div>

              
              <div class="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">Joining Date</span>
                <span class="font-semibold text-slate-800">
                  {employee.joiningDate ?? "Not set"}
                </span>
              </div>

              
              <div class="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">Work Email</span>
                <span class="font-mono text-slate-800 truncate" title={employee.workEmail ?? ""}>
                  {employee.workEmail ?? "—"}
                </span>
              </div>

              
              <div class="flex flex-col py-1 border-b border-slate-100/70 sm:border-b-0">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">Reporting Manager</span>
                <span class="font-semibold text-slate-800 truncate" title={employee.reportingManager ? `${employee.reportingManager.displayName} (${employee.reportingManager.employeeId})` : ""}>
                  {#if employee.reportingManager}{`${employee.reportingManager.displayName} (${employee.reportingManager.employeeId})`}{:else}{"Not assigned"}{/if}
                </span>
              </div>

              
              <div class="flex flex-col py-1">
                <span class="text-[11px] font-medium text-slate-400 mb-0.5">Lifecycle Status</span>
                <div>
                  <span class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shrink-0`}>
                    <span class={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`}></span>
                    {employee.status.toUpperCase()}
                  </span>
                </div>
              </div>

              
              {#if employee.team}<div class="flex flex-col py-1">
                  <span class="text-[11px] font-medium text-slate-400 mb-0.5">Team / Squad</span>
                  <span class="font-semibold text-slate-800 truncate">
                    {employee.team.name} ({employee.team.code})
                  </span>
                </div>{/if}

              
              {#if employee.location}<div class="flex flex-col py-1">
                  <span class="text-[11px] font-medium text-slate-400 mb-0.5">Location</span>
                  <span class="font-semibold text-slate-800 truncate">
                    {employee.location.name}
                  </span>
                </div>{/if}
            </div>
          </div>

          
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                  <SvgIcon name="Clock" class="h-4 w-4" />
                </div>
                <div>
                  <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Work Shift &amp; Schedule
                  </h2>
                  <p class="text-[11px] text-slate-400">Assigned working hours, policies, and punch verifications</p>
                </div>
              </div>
              {#if canReadAttendance}<a href={`/app/attendance?employeeId=${employee.id}`} class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <span>Logs →</span>
                </a>{/if}
            </div>

            
            <div class="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-slate-800">
                      {#if employee.shift}{employee.shift.name}{:else}{"Not assigned"}{/if}
                    </span>
                    {#if employee.shift?.code}<span class="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 font-medium">
                        {employee.shift.code}
                      </span>{/if}
                  </div>
                  <div class="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900">
                    {#if employee.shift}{`${employee.shift.startTime.slice(0, 5)} – ${employee.shift.endTime.slice(0, 5)}`}{:else}{"—"}{/if}
                  </div>
                </div>

                <div class="shrink-0">
                  {#if employee.shift}{#if employee.shift.overnight}<span class="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 shadow-2xs">
                        <SvgIcon name="Moon" class="h-3.5 w-3.5" />
                        Overnight Shift (Crosses Midnight)
                      </span>{:else}<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 shadow-2xs">
                        <SvgIcon name="Sun" class="h-3.5 w-3.5 text-emerald-600" />
                        Standard Daytime Shift
                      </span>{/if}{:else}<span class="text-xs font-medium text-slate-400">No shift schedule configured</span>{/if}
                </div>
              </div>

              
              <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                <div>
                  <span class="text-[10px] font-medium uppercase tracking-wider text-slate-400">Break Duration</span>
                  <p class="mt-0.5 font-semibold text-slate-800">
                    {#if employee.shift}{`${employee.shift.breakMinutes ?? 0} mins`}{:else}{"—"}{/if}
                  </p>
                </div>
                <div>
                  <span class="text-[10px] font-medium uppercase tracking-wider text-slate-400">Grace Period</span>
                  <p class="mt-0.5 font-semibold text-slate-800">
                    {#if employee.shift}{`${employee.shift.graceMinutes ?? 0} mins`}{:else}{"—"}{/if}
                  </p>
                </div>
                <div class="col-span-2">
                  <span class="text-[10px] font-medium uppercase tracking-wider text-slate-400">Attendance Policy</span>
                  <p class="mt-0.5 font-semibold text-slate-800">Standard Punch Verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div class="lg:col-span-5 xl:col-span-4 space-y-5">
          
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div class="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                <SvgIcon name="User" class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Personal Profile
                </h2>
                <p class="text-[11px] text-slate-400">Contact details and personal background</p>
              </div>
            </div>

            <div class="divide-y divide-slate-100 text-xs">
              
              <div class="flex items-center justify-between py-2.5">
                <span class="text-slate-400 font-medium shrink-0">Full Name</span>
                <span class="font-semibold text-slate-800 text-right truncate min-w-0 ml-3">
                  {[employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ")}
                </span>
              </div>

              
              <div class="flex items-center justify-between py-2.5">
                <span class="text-slate-400 font-medium shrink-0">Personal Email</span>
                <span class="font-mono text-slate-800 text-right truncate min-w-0 ml-3" title={employee.personalEmail ?? ""}>
                  {employee.personalEmail ?? "—"}
                </span>
              </div>

              
              <div class="flex items-center justify-between py-2.5">
                <span class="text-slate-400 font-medium shrink-0">Phone Number</span>
                <span class="text-slate-800 font-medium text-right min-w-0 ml-3">
                  {employee.phone ?? "Not provided"}
                </span>
              </div>

              
              <div class="flex items-center justify-between py-2.5">
                <span class="text-slate-400 font-medium shrink-0">City / Location</span>
                <span class="text-slate-800 text-right truncate min-w-0 ml-3">
                  {employee.city ?? "Not provided"}
                </span>
              </div>

              
              {#if employee.addressLine1}<div class="flex items-center justify-between py-2.5">
                  <span class="text-slate-400 font-medium shrink-0">Address</span>
                  <span class="text-slate-800 text-right truncate min-w-0 ml-3" title={employee.addressLine1}>
                    {employee.addressLine1}
                  </span>
                </div>{/if}

              
              {#if employee.dateOfBirth}<div class="flex items-center justify-between py-2.5">
                  <span class="text-slate-400 font-medium shrink-0">Date of Birth</span>
                  <span class="text-slate-800 font-mono text-right min-w-0 ml-3">{employee.dateOfBirth}</span>
                </div>{/if}

              
              {#if employee.gender}<div class="flex items-center justify-between py-2.5">
                  <span class="text-slate-400 font-medium shrink-0">Gender</span>
                  <span class="text-slate-800 font-medium text-right min-w-0 ml-3 capitalize">{employee.gender}</span>
                </div>{/if}

              
              {#if employee.maritalStatus}<div class="flex items-center justify-between py-2.5">
                  <span class="text-slate-400 font-medium shrink-0">Marital Status</span>
                  <span class="text-slate-800 font-medium text-right min-w-0 ml-3 capitalize">{employee.maritalStatus}</span>
                </div>{/if}
            </div>
          </div>
        </div>
      </div>

      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        <div class="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <SvgIcon name="CheckSquare" class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                Onboarding Checklist
              </h2>
              <p class="text-[11px] text-slate-400">Required steps, tasks, and completion status</p>
            </div>
          </div>

          <div class="pt-4">
            {#if isOwnerRecord && !isOwnerViewer}<div class="rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/30 p-4 text-center">
                <SvgIcon name="ShieldCheck" class="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
                <p class="text-xs font-semibold text-emerald-800">
                  Organization Owner Record Protected
                </p>
                <p class="mt-0.5 text-[11px] text-slate-500 max-w-sm mx-auto">
                  Onboarding, account status, and role configurations for the Organization Owner cannot be modified by other tenant roles.
                </p>
              </div>{:else}{#if canOnboard}<OnboardingChecklist employeeId={employee.id} />{:else}<div class="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <SvgIcon name="ShieldCheck" class="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                <p class="text-xs text-slate-500">
                  Onboarding workflow access is restricted to authorized people-operations roles.
                </p>
              </div>{/if}{/if}
          </div>
        </div>

        
        <div class="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                <SvgIcon name="History" class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Employee Lifecycle History
                </h2>
                <p class="text-[11px] text-slate-400">Audit trail of identity, onboarding, and status changes</p>
              </div>
            </div>
            <span class="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 rounded-md px-2 py-0.5">
              {history.length} records
            </span>
          </div>

          <div class="pt-4">
            {#if history.length === 0}<div class="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <SvgIcon name="History" class="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p class="text-xs text-slate-500 font-medium">No historical events recorded for this employee profile yet.</p>
              </div>{:else}<div class="flex flex-col gap-2.5">
                {#each history as event, index}{@const isFirst = index === 0}{@const isLast = index === history.length - 1}<div class="relative flex items-center gap-3">
                      
                      <div class="relative flex self-stretch w-4 items-center justify-center shrink-0">
                        
                        {#if !isFirst}<div class="absolute top-[-10px] bottom-1/2 left-1/2 -translate-x-1/2 w-0.5 bg-emerald-200"></div>{/if}
                        {#if !isLast}<div class="absolute top-1/2 bottom-[-10px] left-1/2 -translate-x-1/2 w-0.5 bg-emerald-200"></div>{/if}
                        
                        <div class="relative z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600 ring-2 ring-emerald-500/20 shadow-2xs"></div>
                      </div>

                      
                      <div class="flex-1 flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50">
                        <span class="font-semibold text-slate-900 font-mono text-[11px]">
                          {event.eventType}
                        </span>
                        <span class="text-[11px] text-slate-500">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>{/each}
              </div>{/if}
          </div>
        </div>
      </div>
    </div>
