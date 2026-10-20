<script lang="ts">
import type{SVGAttributes}from"svelte/elements";
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface IllustrationProps extends SVGAttributes<SVGSVGElement> {
  class?: string;
  selected?: boolean;
}
let { class:className, selected = false, ...props }:IllustrationProps=$props();
const primary=$derived(selected ? "#059669" : "#10b981");
const accent=$derived(selected ? "#334155" : "#475569");
const bg=$derived(selected ? "#ecfdf5" : "#f1f5f9");
const ring=$derived(selected ? "#a7f3d0" : "#cbd5e1");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      <rect x="38" y="42" width="44" height="30" rx="4" fill={accent} stroke="#1e293b" stroke-width="2"></rect>
      
      <rect x="42" y="46" width="36" height="22" rx="2" fill="#ffffff"></rect>
      
      <path d="M48 53L52 57L48 61" stroke={primary} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      <line x1="56" y1="57" x2="72" y2="57" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"></line>
      <line x1="48" y1="63" x2="64" y2="63" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"></line>
      
      <path d="M32 74L35 72H85L88 74C89 74.8 88.5 76 87.5 76H32.5C31.5 76 31 74.8 32 74Z" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"></path>
      
      <line x1="26" y1="76" x2="94" y2="76" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"></line>
      
      <rect x="80" y="66" width="10" height="14" rx="2" fill="#ffffff" stroke={primary} stroke-width="1.25"></rect>
      <circle cx="85" cy="71" r="2" fill={primary}></circle>
      <line x1="82" y1="76" x2="88" y2="76" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"></line>
    </svg>
