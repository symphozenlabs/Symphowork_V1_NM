<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import Button from "$lib/components/ui/Button.svelte";


type Billing = { subscription: { status: string; billingStatus: string; billingCycle: string; startsAt?: string | null; renewalAt?: string | null; endsAt?: string | null } | null; plan: { name: string; code: string; monthlyPriceCents?: number | null; annualPriceCents?: number | null; currency: string; maxUsers?: number | null; maxStorageBytes?: number | null } | null; usage: { employees: number; projects: number; tasks: number }; providerConfigured: boolean };
function date(value?: string | null) { return value ? new Date(value).toLocaleDateString() : "Not available"; }
function money(value?: number | null, currency = "INR") { return value === null || value === undefined ? "Not configured" : new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value / 100); }


import {onMount} from 'svelte';import {api} from '$lib/client/api';
let data=$state<Billing|null>(null),error=$state(''),loading=$state(true);
onMount(()=>{void api<Billing>('/api/app/billing').then(b=>data=b).catch(e=>error=e.message).finally(()=>loading=false);});

</script>
{#if loading}<Card><CardContent class="p-6 text-sm text-muted">Loading billing information…</CardContent></Card>{:else if error}<Card><CardContent class="p-6 text-sm text-danger"><p role="alert">{error}</p></CardContent></Card>{:else if data}
<div class="space-y-5"><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card><CardContent class="p-5"><p class="text-sm text-muted">Current plan</p><p class="mt-2 text-2xl font-bold">{data.plan?.name ?? "No plan"}</p><p class="text-xs text-muted">{data.plan?.code ?? "Not provisioned"}</p></CardContent></Card><Card><CardContent class="p-5"><p class="text-sm text-muted">Subscription</p><p class="mt-2 text-2xl font-bold">{data.subscription?.status ?? "Not provisioned"}</p><p class="text-xs text-muted">{data.subscription?.billingStatus ?? "No billing state"}</p></CardContent></Card><Card><CardContent class="p-5"><p class="text-sm text-muted">Billing cycle</p><p class="mt-2 text-2xl font-bold capitalize">{data.subscription?.billingCycle ?? "Not available"}</p><p class="text-xs text-muted">Renews {date(data.subscription?.renewalAt)}</p></CardContent></Card><Card><CardContent class="p-5"><p class="text-sm text-muted">Provider</p><p class="mt-2 text-2xl font-bold">{#if data.providerConfigured}{"Configured"}{:else}{"Not configured"}{/if}</p><p class="text-xs text-muted">No payment action is simulated</p></CardContent></Card></div><Card><CardHeader><CardTitle>Usage and limits</CardTitle></CardHeader><CardContent class="grid gap-4 sm:grid-cols-3"><div><p class="text-sm text-muted">Active employees</p><p class="mt-1 text-xl font-bold">{data.usage.employees}{#if data.plan?.maxUsers !== null && data.plan?.maxUsers !== undefined}{` / ${data.plan.maxUsers}`}{:else}{" / Unlimited"}{/if}</p></div><div><p class="text-sm text-muted">Projects</p><p class="mt-1 text-xl font-bold">{data.usage.projects}</p></div><div><p class="text-sm text-muted">Tasks</p><p class="mt-1 text-xl font-bold">{data.usage.tasks}</p></div></CardContent></Card><Card><CardHeader><CardTitle>Plan information</CardTitle></CardHeader><CardContent class="space-y-2 text-sm"><p>Monthly: {money(data.plan?.monthlyPriceCents, data.plan?.currency)}</p><p>Annual: {money(data.plan?.annualPriceCents, data.plan?.currency)}</p><p>Subscription started: {date(data.subscription?.startsAt)}</p><p>Subscription ends: {date(data.subscription?.endsAt)}</p>{#if !data.providerConfigured}<p class="rounded-lg border border-warning/30 bg-warning/5 p-3 text-warning">A billing provider is not configured. Plan changes and payment actions are unavailable.</p>{/if}<Button disabled={!data.providerConfigured}>Change plan</Button></CardContent></Card></div>
{/if}