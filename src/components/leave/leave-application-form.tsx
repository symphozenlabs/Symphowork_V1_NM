"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type LeaveType = { id: string; name: string; halfDayAllowed: boolean };
type Application = { id: string; startDate: string; endDate: string; requestedDays: number; reason: string; status: string; typeName?: string | null };
type Balance = { id: string; openingBalance: number; accrued: number; consumed: number; pending: number; adjusted: number; leaveYear: number; typeName?: string | null };

export function LeaveApplicationForm() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "", halfDay: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [typesResponse, leaveResponse] = await Promise.all([fetch("/api/app/leave/types"), fetch("/api/app/leave")]);
      const [typesBody, leaveBody] = await Promise.all([typesResponse.json(), leaveResponse.json()]);
      if (!typesResponse.ok || !typesBody.success) throw new Error(typesBody.error?.message ?? "Unable to load leave types.");
      if (!leaveResponse.ok || !leaveBody.success) throw new Error(leaveBody.error?.message ?? "Unable to load leave history.");
      setTypes(typesBody.leaveTypes);
      setApplications(leaveBody.applications.map((row: { application: Application; typeName?: string | null }) => ({ ...row.application, typeName: row.typeName })));
      setBalances(leaveBody.balances.map((row: { balance: Balance; typeName?: string | null }) => ({ ...row.balance, typeName: row.typeName })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (form.endDate < form.startDate) {
      const err = "End date must be on or after the start date.";
      setError(err);
      showToast({ type: "error", title: "Validation error", message: err });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/app/leave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to submit leave request.");
      const succMsg = "Leave request submitted for approval.";
      setMessage(succMsg);
      showToast({ type: "success", title: "Leave requested", message: succMsg });
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "", halfDay: false });
      await load();
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unable to submit leave request.";
      setError(msg);
      showToast({ type: "error", title: "Request failed", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={submit} className="grid gap-4 rounded-xl border p-5 bg-surface shadow-sm">
        <div>
          <h2 className="font-semibold text-primary">Request leave</h2>
          <p className="mt-1 text-sm text-muted">Your request will follow the organization approval workflow.</p>
        </div>
        <label className="grid gap-1 text-sm">
          Leave type
          <select
            required
            className="h-10 rounded-lg border bg-surface px-3"
            value={form.leaveTypeId}
            onChange={(event) => setForm({ ...form, leaveTypeId: event.target.value, halfDay: false })}
          >
            <option value="">Select a type</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Start date
            <Input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            End date
            <Input required type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
          </label>
        </div>
        {types.find((type) => type.id === form.leaveTypeId)?.halfDayAllowed && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.halfDay} onChange={(event) => setForm({ ...form, halfDay: event.target.checked })} />
            Half-day request
          </label>
        )}
        <label className="grid gap-1 text-sm">
          Reason
          <textarea
            required
            className="min-h-24 rounded-lg border bg-surface p-3"
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
          />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {message && <p aria-live="polite" className="text-sm text-success">{message}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit request"}
        </Button>
      </form>
      <div className="space-y-6">
        <section>
          <h2 className="font-semibold text-primary">Available balances</h2>
          {loading ? (
            <p className="mt-2 text-sm text-muted">Loading balances…</p>
          ) : balances.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No leave balances have been configured yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {balances.map((row) => (
                <div key={row.id} className="rounded-xl border p-3 text-sm bg-surface shadow-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{row.typeName ?? "Leave"}</span>
                    <span>{row.leaveYear}</span>
                  </div>
                  <p className="mt-1 text-muted">
                    Available: {(row.openingBalance + row.accrued + row.adjusted - row.consumed - row.pending).toFixed(1)} days · Pending: {row.pending.toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="font-semibold text-primary">Request history</h2>
          {loading ? (
            <p className="mt-2 text-sm text-muted">Loading history…</p>
          ) : applications.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No leave requests yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {applications.map((application) => (
                <div key={application.id} className="rounded-xl border p-3 text-sm bg-surface shadow-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{application.typeName ?? "Leave"}</span>
                    <span className="capitalize text-muted">{application.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-muted">
                    {application.startDate} → {application.endDate} · {application.requestedDays} day(s)
                  </p>
                  <p className="mt-1 text-muted">{application.reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

