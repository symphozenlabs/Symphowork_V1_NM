<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import OrganizationAttendanceDashboard from "$lib/components/attendance/OrganizationAttendanceDashboard.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import AttendanceActions from "$lib/components/attendance/AttendanceActions.svelte";
import RegularizationPanel from "$lib/components/attendance/RegularizationPanel.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let {
  canViewOthers = false,
  userRoleKey,
  initialEmployeeId = "",
  initialDate = "",
}:{
  canViewOthers?: boolean;
  userRoleKey?: string;
  initialEmployeeId?: string;
  initialDate?: string;
}=$props();
const searchParams=$derived(routePage.url.searchParams);
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
const pathname=$derived(routePage.url.pathname);
const queryTab=$derived(searchParams.get("tab"));
const defaultTab=$derived(canViewOthers ? "organization" : "personal");
let activeTab=$state<"organization" | "personal" | "regularization">(untrack(()=>(queryTab === "personal" || queryTab === "regularization" || queryTab === "organization"
      ? queryTab
      : defaultTab)));
const setActiveTab=(next:typeof activeTab|((previous:typeof activeTab)=>typeof activeTab))=>{activeTab=typeof next==="function"?(next as (previous:typeof activeTab)=>typeof activeTab)(activeTab):next;};
const handleTabChange = (tab: "organization" | "personal" | "regularization") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
</script>
<div class="space-y-6">
      
      {#if canViewOthers}<div class="flex border-b border-slate-200">
          <nav class="-mb-px flex space-x-6" aria-label="Attendance Views">
            <button type="button" onclick={() => handleTabChange("organization")} class={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "organization"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}>
              <SvgIcon name="LayoutDashboard" class="size-4" />
              Organization Dashboard
            </button>
            <button type="button" onclick={() => handleTabChange("personal")} class={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "personal"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}>
              <SvgIcon name="Clock" class="size-4" />
              My Time Clock & Punches
            </button>
            <button type="button" onclick={() => handleTabChange("regularization")} class={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "regularization"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}>
              <SvgIcon name="FileCheck2" class="size-4" />
              Regularization Requests
            </button>
          </nav>
        </div>{/if}

      
      {#if canViewOthers && activeTab === "organization"}<OrganizationAttendanceDashboard userRoleKey={userRoleKey} />{/if}

      
      {#if (!canViewOthers || activeTab === "personal")}<Card class="border-border/80 bg-surface shadow-xs">
          <CardHeader class="border-b border-border/50 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SvgIcon name="Clock" class="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle class="text-base font-semibold text-foreground">
                  Today’s Shift Status & Punch Terminal
                </CardTitle>
                <p class="text-xs text-muted">
                  Punches are timestamped using organization timezone and assigned shift parameters
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent class="pt-6">
            <AttendanceActions canViewOthers={canViewOthers} initialEmployeeId={initialEmployeeId} initialDate={initialDate} />
          </CardContent>
        </Card>{/if}

      
      {#if (!canViewOthers || activeTab === "regularization")}<RegularizationPanel />{/if}
    </div>
