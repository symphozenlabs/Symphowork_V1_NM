<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import DocumentCenter from "$lib/components/documents/DocumentCenter.svelte";

</script>
<div class="space-y-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div class="flex items-center gap-2"><span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Enterprise Document Vault
            </span><span class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium"><SvgIcon name="ShieldCheck" class="h-3 w-3 text-emerald-600" />Tenant Encrypted Storage
            </span></div><h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Document Repository & Records
          </h1><p class="mt-1 text-sm text-muted">Securely upload, store, and manage confidential employee records, identity documents, tax forms, and company compliance policies.
          </p></div></div><Card class="border-border/80 bg-surface shadow-xs"><CardHeader class="border-b border-border/50 pb-4"><div class="flex items-center gap-2.5"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><SvgIcon name="FolderLock" class="h-4.5 w-4.5" /></div><div><CardTitle class="text-base font-semibold text-foreground">Document Repository Terminal
              </CardTitle><p class="text-xs text-muted">Managed storage with cryptographic access controls and audit tracking
              </p></div></div></CardHeader><CardContent class="pt-6"><DocumentCenter /></CardContent></Card></div>
