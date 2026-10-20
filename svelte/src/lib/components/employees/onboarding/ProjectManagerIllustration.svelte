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
const primary=$derived(selected ? "#7c3aed" : "#8b5cf6");
const accent=$derived(selected ? "#6d28d9" : "#7c3aed");
const bg=$derived(selected ? "#f5f3ff" : "#faf5ff");
const ring=$derived(selected ? "#ddd6fe" : "#e9d5ff");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      <rect x="32" y="28" width="56" height="64" rx="7" fill="#ffffff" stroke={primary} stroke-width="2.5"></rect>
      
      <line x1="50" y1="36" x2="50" y2="84" stroke={ring} stroke-width="1.5"></line>
      <line x1="70" y1="36" x2="70" y2="84" stroke={ring} stroke-width="1.5"></line>
      
      <rect x="36" y="34" width="10" height="4" rx="1.5" fill={primary} opacity="0.6"></rect>
      <rect x="54" y="34" width="12" height="4" rx="1.5" fill={primary} opacity="0.6"></rect>
      <rect x="74" y="34" width="10" height="4" rx="1.5" fill={primary} opacity="0.6"></rect>
      
      <rect x="35" y="42" width="12" height="12" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"></rect>
      <rect x="35" y="58" width="12" height="10" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"></rect>
      
      <rect x="53" y="42" width="14" height="16" rx="2" fill={selected ? "#ede9fe" : "#f5f3ff"} stroke={primary} stroke-width="1.25"></rect>
      <circle cx="60" cy="50" r="2.5" fill={primary}></circle>
      
      <rect x="73" y="42" width="12" height="10" rx="2" fill="#f0fdf4" stroke="#86efac" stroke-width="1"></rect>
      <path d="M76 47L78 49L82 45" stroke="#16a34a" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path>
      <rect x="73" y="56" width="12" height="10" rx="2" fill="#f0fdf4" stroke="#86efac" stroke-width="1"></rect>
      <path d="M76 61L78 63L82 59" stroke="#16a34a" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path>
      
      <circle cx="82" cy="28" r="8" fill={accent}></circle>
      <path d="M82 23L84 27L88 28L84 29L82 33L80 29L76 28L80 27L82 23Z" fill="#ffffff"></path>
    </svg>
