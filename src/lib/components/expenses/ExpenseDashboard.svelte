<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {matchExpenseItems} from '$lib/client/expense-items';
import {validateDocumentFile} from '$lib/client/document-file';
import {untrack} from "svelte";
import {page} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
type Category = { id: string; name: string };
type Claim = { id: string; claimNumber: string; title: string; totalAmount: number; status: string };
type Item = { categoryId: string; expenseDate: string; description: string; amount: string; receipt: File | null };
let createdClaimId=$state<string|null>(null);
const emptyItem = (): Item => ({ categoryId: "", expenseDate: "", description: "", amount: "", receipt: null });
let categories=$state<Category[]>(untrack(()=>[]));
const setCategories=(next:typeof categories|((previous:typeof categories)=>typeof categories))=>{categories=typeof next==="function"?(next as (previous:typeof categories)=>typeof categories)(categories):next;};
let claims=$state<Claim[]>(untrack(()=>[]));
const setClaims=(next:typeof claims|((previous:typeof claims)=>typeof claims))=>{claims=typeof next==="function"?(next as (previous:typeof claims)=>typeof claims)(claims):next;};
let items=$state<Item[]>(untrack(()=>[emptyItem()]));
const setItems=(next:typeof items|((previous:typeof items)=>typeof items))=>{items=typeof next==="function"?(next as (previous:typeof items)=>typeof items)(items):next;};
let header=$state(untrack(()=>({ title: "", description: "", expenseDate: "" })));
const setHeader=(next:typeof header|((previous:typeof header)=>typeof header))=>{header=typeof next==="function"?(next as (previous:typeof header)=>typeof header)(header):next;};
let loading=$state(untrack(()=>true));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let busy=$state(untrack(()=>false));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
let message=$state(untrack(()=>""));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let error=$state(untrack(()=>""));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
const loadClaims = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/app/expenses");
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to load claims.");
      setClaims(body.claims);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load claims.");
    } finally {
      setLoading(false);
    }
  };
$effect(()=>{return untrack(() => {
    void Promise.all([
      fetch("/api/app/expenses/categories")
        .then((response) => response.json())
        .then((body) => {
          if (body.success) setCategories(body.categories);
        }),
      loadClaims()
    ]);
  });});
const total=$derived.by(() => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
const updateItem = (index: number, changes: Partial<Item>) =>
    setItems((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));
const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (busy || createdClaimId) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (!header.title.trim() || !header.expenseDate || !items.length) throw new Error("Title, expense date and at least one item are required.");
      for (const item of items) {
        if (!item.categoryId || !item.expenseDate || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0) throw new Error("Every item needs a category, date and positive amount.");
        if (item.receipt) validateDocumentFile(item.receipt);
      }
      const response = await fetch("/api/app/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...header,
          items: items.map((item) => ({
            categoryId: item.categoryId,
            expenseDate: item.expenseDate,
            description: item.description,
            amount: Number(item.amount)
          }))
        })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to create claim.");
      createdClaimId = body.claim.id;
      const detailResponse = await fetch(`/api/app/expenses/${body.claim.id}`);
      const detail = await detailResponse.json();
      if (!detailResponse.ok || !detail.success) throw new Error("Claim was created, but its items could not be loaded for receipt attachment.");
      const savedItems = matchExpenseItems(items, detail.items);
      for (const [index, item] of items.entries()) {
        if (item.receipt) {
          const form = new FormData();
          form.set("file", item.receipt);
          const uploadResponse = await fetch(`/api/app/expenses/items/${savedItems[index].id}/receipt`, {
            method: "POST",
            body: form
          });
          const uploadBody = await uploadResponse.json();
          if (!uploadResponse.ok || !uploadBody.success) throw new Error(uploadBody.error?.message ?? "Receipt upload failed.");
        }
      }
      const submitResponse = await fetch(`/api/app/expenses/${body.claim.id}/submit`, { method: "POST" });
      const submitted = await submitResponse.json();
      if (!submitResponse.ok || !submitted.success) throw new Error(submitted.error?.message ?? "Draft created; submission needs attention.");
      createdClaimId = null;
      const succMsg = `${body.claim.claimNumber} submitted for approval.`;
      setMessage(succMsg);
      showToast({ type: "success", title: "Claim submitted", message: succMsg });
      setHeader({ title: "", description: "", expenseDate: "" });
      setItems([emptyItem()]);
      await loadClaims();
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unable to submit claim.";
      setError(msg);
      showToast({ type: "error", title: "Claim failed", message: msg });
    } finally {
      setBusy(false);
    }
  };
</script>
<div class="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <form onsubmit={submit} class="grid gap-4 bg-surface p-6 rounded-xl border shadow-sm">
        <div class="grid gap-4 md:grid-cols-3">
          <label class="grid gap-1 text-sm md:col-span-2">
            Title
            <Input required value={header.title} oninput={(event) => setHeader({ ...header, title: event.currentTarget.value })} />
          </label>
          <label class="grid gap-1 text-sm">
            Expense date
            <Input required type="date" value={header.expenseDate} oninput={(event) => setHeader({ ...header, expenseDate: event.currentTarget.value })} />
          </label>
        </div>
        <label class="grid gap-1 text-sm">
          Description
          <textarea class="min-h-20 rounded-lg border bg-surface p-3" value={header.description} oninput={(event) => setHeader({ ...header, description: event.currentTarget.value })}></textarea>
        </label>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="font-semibold text-primary">Items</p>
            <p class="font-semibold text-primary">Total: ₹{total.toFixed(2)}</p>
          </div>
          {#each items as item, index}<div class="grid gap-2 rounded-xl border p-3 md:grid-cols-4 bg-[#F7F8FB]">
              <select required aria-label={`Category ${index + 1}`} class="h-10 rounded-lg border bg-surface px-3" value={item.categoryId} oninput={(event) => updateItem(index, { categoryId: event.currentTarget.value })}>
                <option value="">Category</option>
                {#each categories as category}<option value={category.id}>
                    {category.name}
                  </option>{/each}
              </select>
              <Input required aria-label={`Expense date ${index + 1}`} type="date" value={item.expenseDate} oninput={(event) => updateItem(index, { expenseDate: event.currentTarget.value })} />
              <Input required aria-label={`Description ${index + 1}`} placeholder="Description" value={item.description} oninput={(event) => updateItem(index, { description: event.currentTarget.value })} />
              <Input required aria-label={`Amount ${index + 1}`} min="0.01" step="0.01" type="number" placeholder="Amount" value={item.amount} oninput={(event) => updateItem(index, { amount: event.currentTarget.value })} />
              <label class="grid gap-1 text-xs text-muted md:col-span-3">
                Receipt (optional)
                <input type="file" accept="application/pdf,image/jpeg,image/png" oninput={(event) => updateItem(index, { receipt: event.currentTarget.files?.[0] ?? null })} />
              </label>
              {#if items.length > 1}<Button type="button" size="sm" variant="ghost" onclick={() => setItems(items.filter((_, rowIndex) => rowIndex !== index))}>
                  Remove item
                </Button>{/if}
            </div>{/each}
        </div>
        <div class="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onclick={() => setItems([...items, emptyItem()])}>
            Add item
          </Button>
          <Button type="submit" disabled={busy || Boolean(createdClaimId)}>
            {#if busy}{"Submitting…"}{:else}{"Submit claim"}{/if}
          </Button>
        </div>
        {#if createdClaimId}<p role="status" class="rounded-lg border p-3 text-sm">A draft was created. <a class="font-semibold text-primary underline" href={`/app/expenses/${createdClaimId}`}>Open draft to finish receipts and submit</a>. Your entered data remains here; submitting again is disabled to avoid creating another claim.</p>{/if}
        {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
        {#if message}<p aria-live="polite" class="text-sm text-success">{message}</p>{/if}
      </form>
      <div class="space-y-3">
        <p class="font-semibold text-primary">Recent claims</p>
        {#if loading}<p class="text-sm text-muted">Loading claims…</p>{:else}{#if claims.length === 0}<p class="text-sm text-muted">No claims yet.</p>{:else}{#each claims as claim}<a href={`/app/expenses/${claim.id}`} class="block rounded-xl border p-4 hover:bg-surface transition-colors shadow-sm">
              <div class="flex justify-between gap-3">
                <span class="font-medium text-primary">{claim.claimNumber}</span>
                <span class="text-sm capitalize text-muted">{claim.status.replaceAll("_", " ")}</span>
              </div>
              <p class="mt-1 text-sm text-muted">
                {claim.title} · ₹{claim.totalAmount}
              </p>
            </a>{/each}{/if}{/if}
      </div>
    </div>
