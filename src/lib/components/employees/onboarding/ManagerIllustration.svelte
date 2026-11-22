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
const primary=$derived(selected ? "#4f46e5" : "#6366f1");
const accent=$derived(selected ? "#4338ca" : "#4f46e5");
const bg=$derived(selected ? "#eef2ff" : "#f5f3ff");
const ring=$derived(selected ? "#c7d2fe" : "#ddd6fe");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      
      <circle cx="60" cy="38" r="10" fill={primary}></circle>
      <path d="M56 38L59 41L65 35" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      
      <line x1="60" y1="48" x2="60" y2="58" stroke={accent} stroke-width="2"></line>
      <line x1="38" y1="58" x2="82" y2="58" stroke={accent} stroke-width="2"></line>
      <line x1="38" y1="58" x2="38" y2="68" stroke={accent} stroke-width="2"></line>
      <line x1="60" y1="58" x2="60" y2="68" stroke={accent} stroke-width="2"></line>
      <line x1="82" y1="58" x2="82" y2="68" stroke={accent} stroke-width="2"></line>
      
      <circle cx="38" cy="74" r="7" fill="#ffffff" stroke={primary} stroke-width="2"></circle>
      <circle cx="38" cy="74" r="3" fill={primary}></circle>
      <circle cx="60" cy="74" r="7" fill="#ffffff" stroke={primary} stroke-width="2"></circle>
      <circle cx="60" cy="74" r="3" fill={primary}></circle>
      <circle cx="82" cy="74" r="7" fill="#ffffff" stroke={primary} stroke-width="2"></circle>
      <circle cx="82" cy="74" r="3" fill={primary}></circle>
      
      <rect x="48" y="86" width="24" height="10" rx="3" fill={primary}></rect>
      <path d="M56 86V83C56 82 57 81 58 81H62C63 81 64 82 64 83V86" stroke={primary} stroke-width="1.5"></path>
    </svg>
