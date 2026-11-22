<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {mutation} from '$lib/client/api';
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
type SearchResponse = { interpretation: { skills: string[]; locations: string[]; experienceMin?: number; noticePeriodMax?: number; ambiguityFlags: string[] }; candidates: Array<{ id: string; fullName: string; currentDesignation?: string | null; location?: string | null; totalExperience?: number | null; relevantExperience?: number | null; noticePeriodDays?: number | null; skills: Array<{ skillName: string }> }>; semanticUsed: boolean; providerStatus: string };
let query=$state(untrack(()=>("")));
const setQuery=(next:typeof query|((previous:typeof query)=>typeof query))=>{query=typeof next==="function"?(next as (previous:typeof query)=>typeof query)(query):next;};
let result=$state<SearchResponse | null>(untrack(()=>(null)));
const setResult=(next:typeof result|((previous:typeof result)=>typeof result))=>{result=typeof next==="function"?(next as (previous:typeof result)=>typeof result)(result):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let error=$state('');
async function submit(event:SubmitEvent){
 event.preventDefault();if(loading||!query.trim())return;setLoading(true);error='';setResult(null);
 try{setResult(await mutation<SearchResponse>('/api/app/ats/intelligence/search','POST',{query:query.trim()}));}
 catch(cause){error=cause instanceof Error?cause.message:'Unable to search candidates.';}
 finally{setLoading(false);}
}
</script>
<div class="space-y-6"><Card><CardHeader><CardTitle>Find candidates with recruiter intelligence</CardTitle></CardHeader><CardContent><form onsubmit={submit} class="flex gap-3"><Input value={query} oninput={(event) => setQuery(event.currentTarget.value)} placeholder="React developers with 4+ years in Chennai, available within 30 days" /><Button type="submit" disabled={loading || !query.trim()}>{#if loading}{"Interpreting…"}{:else}{"Search"}{/if}</Button></form></CardContent></Card>{#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}{#if result}<Card><CardHeader><CardTitle>Search interpretation</CardTitle></CardHeader><CardContent class="space-y-2 text-sm"><p><strong>Skills:</strong> {result.interpretation.skills.join(", ") || "No strict skill requirement"}</p><p><strong>Location:</strong> {result.interpretation.locations.join(", ") || "Not specified"}</p><p><strong>Experience:</strong> {#if result.interpretation.experienceMin}{`${result.interpretation.experienceMin}+ years`}{:else}{"Not specified"}{/if}</p><p><strong>Notice:</strong> {#if result.interpretation.noticePeriodMax}{`≤ ${result.interpretation.noticePeriodMax} days`}{:else}{"Not specified"}{/if}</p>{#each result.interpretation.ambiguityFlags as flag}<p class="text-muted">{flag}</p>{/each}<p class="text-xs text-muted">{#if result.semanticUsed}{"Semantic retrieval used."}{:else}{`Structured search only — semantic provider ${result.providerStatus}.`}{/if}</p></CardContent></Card><div class="grid gap-4 md:grid-cols-2">{#if !result.candidates.length}<p class="text-sm text-muted">No candidates match this search.</p>{/if}{#each result.candidates as candidate}<Card><CardHeader><CardTitle>{candidate.fullName}</CardTitle></CardHeader><CardContent class="space-y-2 text-sm"><p>{candidate.currentDesignation || "Role not specified"} · {candidate.location || "Location not specified"}</p><p>{candidate.relevantExperience ?? candidate.totalExperience ?? "?"} years relevant/total experience · notice {candidate.noticePeriodDays ?? "unknown"} days</p><p class="text-muted">{candidate.skills.map((skill) => skill.skillName).join(", ") || "No skills recorded"}</p></CardContent></Card>{/each}</div>{/if}</div>
