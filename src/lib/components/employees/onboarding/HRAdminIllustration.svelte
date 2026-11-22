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
const primary=$derived(selected ? "#059669" : "#0d9488");
const accent=$derived(selected ? "#10b981" : "#14b8a6");
const bg=$derived(selected ? "#ecfdf5" : "#f0fdfa");
const ring=$derived(selected ? "#a7f3d0" : "#ccfbf1");
</script>
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class={className} aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} stroke-width="2"></circle>
      
      <path d="M60 22L84 32V58C84 75 73.5 88.5 60 94C46.5 88.5 36 75 36 58V32L60 22Z" fill="#ffffff" stroke={primary} stroke-width="2.5" stroke-linejoin="round"></path>
      
      <path d="M60 27L79 35.5V57C79 71 70.5 82 60 87C49.5 82 41 71 41 57V35.5L60 27Z" fill={selected ? "#d1fae5" : "#e6fffa"} opacity="0.75"></path>
      
      
      <circle cx="60" cy="46" r="8" fill={primary}></circle>
      
      <path d="M48 68C48 61.3726 53.3726 56 60 56C66.6274 56 72 61.3726 72 68V72H48V68Z" fill={primary}></path>
      
      <rect x="56" y="74" width="8" height="10" rx="2" fill={accent}></rect>
      <circle cx="60" cy="79" r="1.5" fill="#ffffff"></circle>
      
      <path d="M60 30L61.5 34.5L66 36L61.5 37.5L60 42L58.5 37.5L54 36L58.5 34.5L60 30Z" fill={accent}></path>
    </svg>
