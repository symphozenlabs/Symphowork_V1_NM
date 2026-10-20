<script lang="ts">
import OrganizationWizard from '$lib/components/platform/OrganizationCreateWizard.svelte';
import Invitation from '$lib/components/employees/EmployeeInvitationActions.svelte';
import PendingContent from '$lib/components/loading/PendingContent.svelte';
let pendingPath=$state<string|null>('/app/employees');
import Work from '$lib/components/collaboration/CollaborationWorkspace.svelte';
import Profile from '$lib/components/employees/SelfProfileForm.svelte';
import DepartmentDelete from '$lib/components/departments/DepartmentDeleteDialog.svelte';
import DepartmentCreate from '$lib/components/departments/DepartmentCreateDialog.svelte';
import DepartmentTeam from '$lib/components/departments/DepartmentTeamDialog.svelte';
import Notifications from '$lib/components/notifications/NotificationCenter.svelte';
import Intelligence from '$lib/components/ats/RecruiterIntelligenceSearch.svelte';
import Interviews from '$lib/components/ats/AtsInterviewPanel.svelte';
import OrganizationStatus from '$lib/components/platform/OrganizationStatusActions.svelte';
import Provisioning from '$lib/components/platform/ProvisioningJobActions.svelte';
import Auth from '$lib/components/auth/AuthForm.svelte';
let dialogOpen=$state(true),saved=$state(false);
import Resume from '$lib/components/ats/ResumeIntelligencePanel.svelte';
import Configuration from '$lib/components/platform/ConfigurationEditor.svelte';
import Workspace from '$lib/components/chat/ChatWorkspace.svelte';
import Voice from '$lib/components/chat/VoiceRecorder.svelte';
import Composer from '$lib/components/chat/ChatInputBar.svelte';
let voiceAttempts=$state(0),voiceError=$state(''),voiceDone=$state(false),sentText=$state('');
let originalFile:File|null=null;
async function sendVoice(file:File){voiceAttempts++;if(voiceAttempts===1){originalFile=file;throw new Error('Synthetic upload unavailable.');}if(file!==originalFile)throw new Error('File identity changed during retry.');voiceDone=true;}
import Leave from '$lib/components/leave/LeaveApplicationForm.svelte';
import Regularization from '$lib/components/attendance/RegularizationPanel.svelte';
import Approvals from '$lib/components/approvals/ApprovalInbox.svelte';
import Onboarding from '$lib/components/employees/onboarding/OnboardingWizard.svelte';
import Detail from '$lib/components/expenses/ExpenseDetail.svelte';
import Expenses from '$lib/components/expenses/ExpenseDashboard.svelte';
import Payroll from '$lib/components/payroll/PayrollDashboard.svelte';
import Documents from '$lib/components/documents/DocumentCenter.svelte';
import Payslips from '$lib/components/payroll/PayslipList.svelte';
import Attendance from '$lib/components/attendance/AttendanceActions.svelte';
import FeatureFlags from '$lib/components/platform/FeatureFlagToggle.svelte';
import AuditList from '$lib/components/platform/PlatformAuditList.svelte';
import Directory from '$lib/components/employees/WorkforceDirectoryTable.svelte';
import EditEmployee from '$lib/components/employees/EditEmployeeDialog.svelte';
import GrowthHud from '$lib/components/hud/EnterpriseGrowthHud.svelte';
import ConstellationHud from '$lib/components/hud/EcosystemConstellationHud.svelte';
import NetworkHud from '$lib/components/hud/WorkforceNetworkHud.svelte';
import AtsDashboard from '$lib/components/ats/AtsDashboard.svelte';

const view=new URLSearchParams(location.search).get('view');

const sampleEmployee = {
  id: 'employee-1',
  organizationId: 'org-1',
  userId: 'user-1',
  employeeId: 'EMP0001',
  firstName: 'Ada',
  middleName: 'Augusta',
  lastName: 'Lovelace',
  displayName: 'Ada Lovelace',
  personalEmail: 'ada@example.test',
  workEmail: 'ada@symphowork.test',
  phone: '+15551234567',
  employmentType: 'FULL_TIME',
  status: 'ACTIVE',
  joiningDate: '2026-01-01',
  confirmationDate: '2026-04-01',
  departmentId: 'dept-1',
  department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
  designationId: 'desig-1',
  designation: { id: 'desig-1', name: 'Chief Architect' },
  managerId: null,
  manager: null,
  role: 'ORGANIZATION_OWNER',
  roleKey: 'ORGANIZATION_OWNER',
  isOwner: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
} as any;
</script>

{#if view==='directory'}
  <Directory initialEmployees={[]} initialTotal={0} initialPage={1} initialPageSize={10} canInvite={false}/>
{:else if view==='organization-wizard'}
  <OrganizationWizard initialPlans={[{id:'plan-1',code:'FREE',name:'Free',description:null,monthlyPriceCents:0,annualPriceCents:0,currency:'INR',trialDays:0,maxUsers:10,maxStorageBytes:null,billingInterval:'monthly',active:true}]}/>
{:else if view==='invitation'}
  <Invitation employeeId="employee-1" email="fixture@example.test" status="invited"/>
{:else if view==='pending'}
  <button onclick={()=>pendingPath=null}>Finish navigation</button>
  <PendingContent path={pendingPath}><button>Previous page action</button></PendingContent>
{:else if view==='intelligence'}
  <Intelligence/>
{:else if view==='work'}
  <Work/>
{:else if view==='profile'}
  <Profile initial={{firstName:'Ada',middleName:'Augusta',lastName:'Lovelace',personalEmail:'ada@example.test',phone:''}}/>
{:else if view==='department-delete'}
  <DepartmentDelete open={dialogOpen} departmentId="department-1" departmentName="Engineering" departmentCode="ENG" onClose={()=>dialogOpen=false} onDeleted={()=>saved=true}/>
{:else if view==='department-create'}
  <DepartmentCreate open={dialogOpen} onClose={()=>dialogOpen=false} onCreated={()=>saved=true}/>
{:else if view==='team-create'}
  <DepartmentTeam open={dialogOpen} mode="create" departmentId="department-1" departmentName="Engineering" onClose={()=>dialogOpen=false} onSaved={()=>saved=true}/>
{:else if view==='notifications'}
  <Notifications/>
{:else if view==='interviews'}
  <Interviews/>
{:else if view==='organization-status'}
  <OrganizationStatus organizationId="organization-1" status="active"/>
{:else if view==='provisioning'}
  <Provisioning organizationId="organization-1" organizationName="Fixture" contactEmail="admin@example.test" job={{status:'failed',currentStep:'invitation',failureMessage:null}}/>
{:else if view==='register-form'}
  <Auth mode="register"/>
{:else if view==='resume'}
  <Resume candidateId="candidate-1"/>
{:else if view==='configuration'}
  <Configuration setting={{key:'fixture.setting',value:'initial'}}/>
{:else if view==='workspace'}
  <Workspace/>
{:else if view==='voice'}
  <p role="status">Attempts: {voiceAttempts}</p>
  <p role="alert">{voiceError}</p>
  {#if voiceDone}
    <p>Voice sent</p>
  {:else}
    <Voice onSendVoice={sendVoice} onCancel={()=>{}} onError={(message)=>voiceError=message}/>
  {/if}
{:else if view==='composer'}
  <Composer sending={false} onSendMessage={async text=>{sentText=text;}}/>
  <p role="status">Sent: {sentText}</p>
{:else if view==='leave'}
  <Leave/>
{:else if view==='regularization'}
  <Regularization/>
{:else if view==='approvals'}
  <Approvals/>
{:else if view==='onboarding'}
  <Onboarding currentUserRole="ORGANIZATION_OWNER"/>
{:else if view==='expenses'}
  <Expenses/>
{:else if view==='payroll'}
  <Payroll/>
{:else if view==='payslips'}
  <Payslips/>
{:else if view==='attendance'}
  <Attendance canViewOthers={true} initialDate="2026-10-20"/>
{:else if view==='documents'}
  <Documents/>
{:else if view==='feature-flags'}
  <FeatureFlags flag={{id:'flag-1',key:'ai_matching',name:'AI Matching',description:'Enable AI matching',enabled:false}}/>
{:else if view==='audit-list'}
  <AuditList initialRows={[{
    audit: { id: 'audit-1', action: 'ORGANIZATION_SUSPEND', resource: 'organization', organizationId: 'org-1', createdAt: '2026-10-20T12:00:00Z' },
    actor: { name: 'admin@symphowork.test' },
    organization: { name: 'Acme' }
  }]} total={1} page={1} pageSize={10} pageCount={1}/>
{:else if view==='edit-employee'}
  <EditEmployee open={dialogOpen} employee={sampleEmployee} currentUserRole="ORGANIZATION_OWNER" isOwnerViewer={true} onSuccess={()=>saved=true} onOpenChange={(o)=>dialogOpen=o}/>
{:else if view==='growth-hud'}
  <GrowthHud/>
{:else if view==='constellation-hud'}
  <ConstellationHud/>
{:else if view==='network-hud'}
  <NetworkHud/>
{:else if view==='ats-dashboard'}
  <AtsDashboard/>
{:else}
  <Detail claimId="draft-1"/>
{/if}

{#if saved}
  <p role="status">Fixture saved</p>
{/if}
