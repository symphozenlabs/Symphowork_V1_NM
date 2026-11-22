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
const primary=$derived(selected ? "#d97706" : "#f59e0b");
const accent=$derived(selected ? "#b45309" : "#d97706");
const bg=$derived(selected ? "#fffbeb" : "#fefce8");
const ring=$derived(selected ? "#fde68a" : "#fef08a");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      <rect x="36" y="28" width="48" height="64" rx="7" fill="#ffffff" stroke={primary} stroke-width="2.5"></rect>
      
      <rect x="42" y="34" width="36" height="14" rx="3" fill={selected ? "#fef3c7" : "#fffbeb"} stroke={primary} stroke-width="1.5"></rect>
      
      <path d="M46 43L52 39L57 42L64 37L73 40" stroke={accent} stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
      
      <circle cx="48" cy="56" r="3" fill={primary}></circle>
      <circle cx="60" cy="56" r="3" fill={primary}></circle>
      <circle cx="72" cy="56" r="3" fill={primary}></circle>
      <circle cx="48" cy="66" r="3" fill={primary}></circle>
      <circle cx="60" cy="66" r="3" fill={primary}></circle>
      <circle cx="72" cy="66" r="3" fill={accent}></circle>
      <circle cx="48" cy="76" r="3" fill={primary}></circle>
      <rect x="57" y="73" width="18" height="6" rx="3" fill={accent}></rect>
      
      <circle cx="82" cy="40" r="10" fill="#fde68a" stroke={primary} stroke-width="2"></circle>
      <text x="82" y="44" text-anchor="middle" fill={accent} font-size="11" font-weight="bold" font-family="sans-serif">₹</text>
    </svg>
