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
const primary=$derived(selected ? "#0f766e" : "#14b8a6");
const accent=$derived(selected ? "#0d9488" : "#2dd4bf");
const bg=$derived(selected ? "#f0fdfa" : "#ecfdf5");
const ring=$derived(selected ? "#99f6e4" : "#a7f3d0");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      
      <circle cx="60" cy="62" r="16" fill="#ffffff" stroke={primary} stroke-width="2.5"></circle>
      <circle cx="60" cy="62" r="6" fill={primary}></circle>
      
      <circle cx="32" cy="46" r="6" fill="#ffffff" stroke={primary} stroke-width="2"></circle>
      <circle cx="88" cy="46" r="6" fill="#ffffff" stroke={primary} stroke-width="2"></circle>
      <circle cx="40" cy="84" r="6" fill="#ffffff" stroke={primary} stroke-width="2"></circle>
      <circle cx="80" cy="84" r="6" fill="#ffffff" stroke={primary} stroke-width="2"></circle>
      
      <line x1="38" y1="50" x2="48" y2="56" stroke={accent} stroke-width="1.75" stroke-dasharray="2 2"></line>
      <line x1="82" y1="50" x2="72" y2="56" stroke={accent} stroke-width="1.75" stroke-dasharray="2 2"></line>
      <line x1="45" y1="80" x2="52" y2="72" stroke={accent} stroke-width="1.75" stroke-dasharray="2 2"></line>
      <line x1="75" y1="80" x2="68" y2="72" stroke={accent} stroke-width="1.75" stroke-dasharray="2 2"></line>
      
      <path d="M60 46V22" stroke={primary} stroke-width="2" stroke-linecap="round"></path>
      <path d="M60 22L76 28L60 34V22Z" fill={accent} stroke={primary} stroke-width="1.5" stroke-linejoin="round"></path>
    </svg>
