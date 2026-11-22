<script lang="ts">
import {navigating} from '$app/state';
import PendingContent from '$lib/components/loading/PendingContent.svelte';
import type {Snippet}from'svelte';import type{Context}from'$lib/auth/policy';import{platformConsoleTitle}from'$lib/auth/platform';import{platformNavGroups,allPlatformItems}from'$lib/components/layout/platform-navigation';
let{context,children}:{context:Context;children:Snippet}=$props();const user=$derived(context.user);const consoleTitle=$derived(platformConsoleTitle(user.platformRole));

import SvgIcon from "$lib/components/ui/Icon.svelte";
import SidebarNav from "$lib/components/layout/SidebarNav.svelte";
import MobileNav from "$lib/components/layout/MobileNav.svelte";
import Breadcrumb from "$lib/components/layout/Breadcrumb.svelte";
import Badge from "$lib/components/ui/Badge.svelte";
import LogoutButton from "$lib/components/layout/LogoutButton.svelte";

</script>
<div class="min-h-screen bg-background">
      
      <aside class="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-[#D5E1D4] bg-[#EDF3EC] text-foreground lg:flex lg:flex-col shadow-xs">
        <div class="shrink-0 px-5 pt-6 pb-4 border-b border-[#D5E1D4] bg-[#E3EFE2]/80">
          <div class="flex items-center justify-between">
            <a href="/platform" class="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90" aria-label="SymphoWork Platform Console">
              <img src="/symphowork-logo.png" alt="SymphoWork" width={150} height={40} class="h-10 w-auto object-contain" />
            </a>
            <span class="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-primary/20 shadow-xs">
              Console
            </span>
          </div>
        </div>

        <div class="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden px-4 pb-6 pt-5 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
          <SidebarNav groups={platformNavGroups} />

          <div class="mt-auto pt-6">
            <div class="rounded-xl border border-[#D5E1D4] bg-surface p-3 shadow-xs">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[#174734]">
                Platform Identity
              </p>
              <p class="mt-1 text-xs font-bold text-foreground truncate">{consoleTitle}</p>
              <p class="mt-0.5 text-[11px] text-muted">Cluster Control Plane</p>
            </div>
          </div>
        </div>
      </aside>

      
      <div class="flex min-h-screen flex-col lg:pl-64">
        <header class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
          <div class="flex items-center gap-3">
            <MobileNav items={allPlatformItems} label="Open platform navigation" />
            <Breadcrumb type="platform" />
          </div>

          <div class="flex items-center gap-3">
            <Badge variant="neutral" class="hidden sm:inline-flex bg-sidebar-active text-sidebar-active-text border-primary/15 font-medium">
              Platform console
            </Badge>
            {#if user}<LogoutButton />{/if}
          </div>
        </header>

        <main class="mx-auto max-w-[1440px] flex-1 p-5 md:p-8"><PendingContent path={navigating.to?.url.pathname??null}>{@render children?.()}</PendingContent></main>
      </div>
    </div>
