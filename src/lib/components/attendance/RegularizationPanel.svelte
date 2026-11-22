<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let attendanceDate=$state("");
let useDate=$state(false);
type RecordRow = { id: string; attendanceDate: string; status: string };
type RequestRow = { id: string; status: string; reason: string; submittedAt: string };
let records=$state<RecordRow[]>(untrack(()=>([])));
const setRecords=(next:typeof records|((previous:typeof records)=>typeof records))=>{records=typeof next==="function"?(next as (previous:typeof records)=>typeof records)(records):next;};
let requests=$state<RequestRow[]>(untrack(()=>([])));
const setRequests=(next:typeof requests|((previous:typeof requests)=>typeof requests))=>{requests=typeof next==="function"?(next as (previous:typeof requests)=>typeof requests)(requests):next;};
let attendanceId=$state(untrack(()=>("")));
const setAttendanceId=(next:typeof attendanceId|((previous:typeof attendanceId)=>typeof attendanceId))=>{attendanceId=typeof next==="function"?(next as (previous:typeof attendanceId)=>typeof attendanceId)(attendanceId):next;};
let requestedIn=$state(untrack(()=>("")));
const setRequestedIn=(next:typeof requestedIn|((previous:typeof requestedIn)=>typeof requestedIn))=>{requestedIn=typeof next==="function"?(next as (previous:typeof requestedIn)=>typeof requestedIn)(requestedIn):next;};
let requestedOut=$state(untrack(()=>("")));
const setRequestedOut=(next:typeof requestedOut|((previous:typeof requestedOut)=>typeof requestedOut))=>{requestedOut=typeof next==="function"?(next as (previous:typeof requestedOut)=>typeof requestedOut)(requestedOut):next;};
let reason=$state(untrack(()=>("")));
const setReason=(next:typeof reason|((previous:typeof reason)=>typeof reason))=>{reason=typeof next==="function"?(next as (previous:typeof reason)=>typeof reason)(reason):next;};
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
const load = async () => {
    try {
      // These GETs may provision employee context; never race them.
      const attendance=await fetch("/api/app/attendance",{cache:'no-store'});
      const regularization=await fetch("/api/app/attendance/regularization",{cache:'no-store'});
      const attendanceBody = await attendance.json();
      const regularizationBody = await regularization.json();
      if (!attendance.ok || !attendanceBody.success) throw new Error(attendanceBody.error?.message ?? "Unable to load attendance records.");
      if (!regularization.ok || !regularizationBody.success) throw new Error(regularizationBody.error?.message ?? "Unable to load regularization requests.");
      setRecords(attendanceBody.records);
      setRequests(regularizationBody.requests);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load regularization.");
    }
  };
$effect(()=>{return untrack(() => {
    void load();
  });});
const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!reason.trim() || (useDate ? !attendanceDate : !attendanceId)) {setError("Choose an attendance record or date and enter a reason.");return;}
    if (requestedIn && requestedOut && requestedOut <= requestedIn) {setError("Requested out must be after requested in.");return;}
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/app/attendance/regularization", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attendanceId: useDate ? undefined : attendanceId,
          attendanceDate: useDate ? attendanceDate : undefined,
          requestedIn: requestedIn || undefined,
          requestedOut: requestedOut || undefined,
          reason: reason.trim()
        })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to submit regularization.");
      const succMsg = "Regularization request submitted for approval.";
      setMessage(succMsg);
      showToast({ type: "success", title: "Regularization submitted", message: succMsg });
      setReason("");
      await load();
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unable to submit regularization.";
      setError(msg);
      showToast({ type: "error", title: "Submission failed", message: msg });
    } finally {
      setBusy(false);
    }
  };
</script>
<div class="space-y-4 rounded-xl border p-5 bg-surface shadow-sm">
      <div>
        <h2 class="font-semibold text-primary">Attendance regularization</h2>
        <p class="mt-1 text-sm text-muted">Request a correction for a missing or incorrect punch. Approval remains in the existing workflow engine.</p>
      </div>
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={useDate} disabled={busy}/>Request correction for a date not listed</label>
      <form onsubmit={submit} class="grid gap-3 md:grid-cols-4">
        {#if useDate}<label class="grid gap-1 text-sm">Attendance date<Input type="date" required bind:value={attendanceDate} disabled={busy}/></label>{:else}<select required aria-label="Attendance record" class="h-10 rounded-lg border bg-surface px-3" value={attendanceId} onchange={(event) => setAttendanceId(event.currentTarget.value)}>
          <option value="">Attendance record</option>
          {#each records as record}<option value={record.id}>
              {record.attendanceDate} · {record.status}
            </option>{/each}
        </select>{/if}
        <Input type="datetime-local" aria-label="Requested in" value={requestedIn} onchange={(event) => setRequestedIn(event.currentTarget.value)} />
        <Input type="datetime-local" aria-label="Requested out" value={requestedOut} onchange={(event) => setRequestedOut(event.currentTarget.value)} />
        <Input required placeholder="Reason" value={reason} oninput={(event) => setReason(event.currentTarget.value)} />
        <Button type="submit" disabled={busy}>
          {#if busy}{"Submitting…"}{:else}{"Submit request"}{/if}
        </Button>
      </form>
      {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
      {#if message}<p role="status" class="text-sm text-success">{message}</p>{/if}
      {#if requests.length > 0}<div class="space-y-2">
          {#each requests as request}<div class="rounded-lg border p-3 text-sm bg-surface shadow-sm">
              <span class="capitalize font-medium text-primary">{request.status.replaceAll("_", " ")}</span>
              <span class="ml-2 text-muted">{request.reason}</span>
            </div>{/each}
        </div>{/if}
    </div>
