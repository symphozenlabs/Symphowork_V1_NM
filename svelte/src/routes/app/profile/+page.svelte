<script lang="ts">
let {data}=$props();const employee=$derived(data.employee);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import SelfProfileForm from "$lib/components/employees/SelfProfileForm.svelte";

</script>
{#if employee}
<div class="mx-auto max-w-3xl space-y-6">
      <div>
        <a href="/app" class="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground">
          <SvgIcon name="ArrowLeft" class="h-3.5 w-3.5" />
          <span>Back to Workspace Dashboard</span>
        </a>
      </div>

      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SvgIcon name="User" class="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle class="text-lg font-bold text-foreground">
                My Employee Profile
              </CardTitle>
              <p class="text-xs text-muted">
                Manage your personal contact information. Employment terms and role assignments are managed by people operations.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="pt-6">
          <SelfProfileForm initial={employee} />
        </CardContent>
      </Card>
    </div>
{:else}<div class="mx-auto max-w-2xl py-10"><Card class="border-border/80 bg-surface shadow-xs"><CardHeader class="border-b border-border/50 pb-4"><CardTitle class="text-lg font-bold">Employee Profile Not Linked</CardTitle></CardHeader><CardContent class="pt-6"><p class="text-sm text-muted leading-relaxed">Your user account does not have a linked employee profile in this organization workspace yet. Contact your human resources administrator to assign your employee profile.</p></CardContent></Card></div>{/if}