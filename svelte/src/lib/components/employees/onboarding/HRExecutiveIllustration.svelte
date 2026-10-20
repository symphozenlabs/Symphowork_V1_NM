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
const primary=$derived(selected ? "#0284c7" : "#0ea5e9");
const accent=$derived(selected ? "#38bdf8" : "#7dd3fc");
const bg=$derived(selected ? "#f0f9ff" : "#f8fafc");
const ring=$derived(selected ? "#bae6fd" : "#e2e8f0");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      <rect x="34" y="26" width="52" height="68" rx="6" fill="#ffffff" stroke={primary} stroke-width="2.5"></rect>
      
      <rect x="48" y="22" width="24" height="8" rx="3" fill={primary}></rect>
      <circle cx="60" cy="26" r="2" fill="#ffffff"></circle>
      
      <circle cx="60" cy="45" r="9" fill={selected ? "#e0f2fe" : "#f1f5f9"} stroke={primary} stroke-width="1.5"></circle>
      <circle cx="60" cy="43" r="4.5" fill={primary}></circle>
      <path d="M53 54C53 50.5 56 48 60 48C64 48 67 50.5 67 54" stroke={primary} stroke-width="1.5" stroke-linecap="round"></path>
      
      <line x1="44" y1="62" x2="68" y2="62" stroke={primary} stroke-width="2" stroke-linecap="round"></line>
      <line x1="44" y1="70" x2="62" y2="70" stroke={accent} stroke-width="2" stroke-linecap="round"></line>
      <line x1="44" y1="78" x2="56" y2="78" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"></line>
      
      <circle cx="74" cy="74" r="8" fill={primary}></circle>
      <path d="M71 74L73.5 76.5L78 72" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
