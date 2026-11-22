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
const primary=$derived(selected ? "#e11d48" : "#f43f5e");
const accent=$derived(selected ? "#be123c" : "#e11d48");
const bg=$derived(selected ? "#fff1f2" : "#ffe4e6");
const ring=$derived(selected ? "#fecdd3" : "#fda4af");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      <rect x="36" y="30" width="48" height="60" rx="6" fill="#ffffff" stroke="#fda4af" stroke-width="2"></rect>
      <circle cx="60" cy="46" r="8" fill="#ffe4e6" stroke={primary} stroke-width="1.5"></circle>
      <circle cx="60" cy="44" r="4" fill={primary}></circle>
      <path d="M54 54C54 51.5 56.5 49.5 60 49.5C63.5 49.5 66 51.5 66 54" stroke={primary} stroke-width="1.5" stroke-linecap="round"></path>
      <line x1="44" y1="62" x2="68" y2="62" stroke="#fda4af" stroke-width="2" stroke-linecap="round"></line>
      <line x1="44" y1="70" x2="60" y2="70" stroke="#fecdd3" stroke-width="2" stroke-linecap="round"></line>
      
      <circle cx="74" cy="64" r="15" fill="#ffffff" stroke={primary} stroke-width="2.5"></circle>
      <circle cx="74" cy="64" r="10" fill={selected ? "#ffe4e6" : "#fff1f2"} opacity="0.6"></circle>
      
      <path d="M74 58L75.5 62L79.5 63.5L75.5 65L74 69L72.5 65L68.5 63.5L72.5 62L74 58Z" fill={accent}></path>
      
      <line x1="84.5" y1="74.5" x2="94" y2="84" stroke={primary} stroke-width="3.5" stroke-linecap="round"></line>
    </svg>
