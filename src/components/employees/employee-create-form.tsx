"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EmployeeCreateForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    personalEmail: "",
    phone: "",
    status: "invited",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/app/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(`Employee ${body.employee?.employeeId} created.`);
        setForm({
          firstName: "",
          lastName: "",
          personalEmail: "",
          phone: "",
          status: "invited",
        });
      } else {
        setMessage(body.error?.message ?? "Unable to create employee.");
      }
    } catch {
      setMessage("Network error occurred while creating employee.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {[
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["personalEmail", "Personal email"],
        ["phone", "Phone"],
      ].map(([key, label]) => (
        <label key={key} className="block text-sm font-semibold">
          {label}
          <Input
            required={key === "firstName" || key === "lastName"}
            type={key === "personalEmail" ? "email" : "text"}
            value={form[key as keyof typeof form]}
            onChange={(event) =>
              setForm({ ...form, [key]: event.target.value })
            }
            className="mt-2"
          />
        </label>
      ))}

      {message && (
        <p role="status" className="rounded-lg bg-[#f0f7ff] p-3 text-sm text-muted">
          {message}
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create employee"}
      </Button>
    </form>
  );
}
