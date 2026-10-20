<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {api,mutation} from '$lib/client/api';
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
type Profile = { candidate: { fullName: string }; documents: Array<{ id: string; fileName: string; version: number; parsingStatus: string; isPrimary: boolean }>; jobs: Array<{ id: string; status: string; attemptCount: number; failureReason?: string | null }>; extractions: Array<{ id: string; reviewStatus: string; normalizedResume: { skills?: Array<{ normalizedName: string; confidence: number; confidenceSource: string }> }; warnings?: string | null }> };
let { candidateId }:{ candidateId: string }=$props();
let profile=$state<Profile|undefined>(untrack(()=>(undefined)));
const setProfile=(next:typeof profile|((previous:typeof profile)=>typeof profile))=>{profile=typeof next==="function"?(next as (previous:typeof profile)=>typeof profile)(profile):next;};
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let loading=$state(true),error=$state(''),busy=$state(false);
const load=$derived.by(()=>{const id=candidateId;return async () => {
 loading=true;error='';
 try{const body=await api<Profile>(`/api/app/ats/candidates/${encodeURIComponent(id)}`);if(id===candidateId)setProfile(body);}
 catch(cause){if(id===candidateId)error=cause instanceof Error?cause.message:'Unable to load candidate resume.';}
 finally{if(id===candidateId)loading=false;}
};});
$effect(()=>{load;return untrack(() => {profile=undefined;message="";void load();});});
async function process(jobId: string, retry = false) {
 if(busy)return;busy=true;error='';setMessage(retry ? "Retrying resume processing…" : "Processing resume…");
 try{await mutation(`/api/app/ats/resumes/jobs/${encodeURIComponent(jobId)}/process`,'POST',{retry});setMessage("Resume status updated.");await load();}
 catch(cause){setMessage('');error=cause instanceof Error?cause.message:'Unable to process resume.';}
 finally{busy=false;}
}
</script>
{#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
{#if loading && !profile}<p class="text-sm text-muted">Loading resume intelligence…</p>{:else if profile}<div class="space-y-5"><div><p class="text-sm text-muted">Resume intelligence for</p><h2 class="text-xl font-bold">{profile.candidate.fullName}</h2></div><section class="space-y-2"><h3 class="font-semibold">Resume versions</h3>{#if profile.documents.length === 0}<p class="text-sm text-muted">No resumes uploaded.</p>{:else}{#each profile.documents as document}<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><span>{document.fileName} · v{document.version}{#if document.isPrimary}{" · Primary"}{:else}{""}{/if}</span><span class="text-xs text-muted">{document.parsingStatus}</span></div>{/each}{/if}</section><section class="space-y-2"><h3 class="font-semibold">Processing</h3>{#each profile.jobs as job}<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><p class="text-sm font-medium">{job.status}</p><p class="text-xs text-muted">Attempts: {job.attemptCount}{#if job.failureReason}{` · ${job.failureReason}`}{:else}{""}{/if}</p></div>{#if job.status.endsWith("failed")}<button disabled={busy} onclick={() => process(job.id, true)} class="rounded-lg border px-3 py-1.5 text-xs">Retry</button>{:else}{#if job.status === "queued"}<button disabled={busy} onclick={() => process(job.id)} class="rounded-lg border px-3 py-1.5 text-xs">Process</button>{:else}{/if}{/if}</div>{/each}{#if message}<p role="status" class="text-sm text-muted">{message}</p>{/if}</section><section class="space-y-2"><h3 class="font-semibold">Extracted skills</h3>{#if profile.extractions.length === 0}<p class="text-sm text-muted">No structured extraction is available yet.</p>{:else}{#each (profile.extractions[0].normalizedResume?.skills ?? []) as skill}<span class="mr-2 inline-flex rounded-full bg-surface px-3 py-1 text-xs">{skill.normalizedName} · {Math.round(skill.confidence * 100)}% {skill.confidenceSource}</span>{/each}{/if}</section></div>{/if}
