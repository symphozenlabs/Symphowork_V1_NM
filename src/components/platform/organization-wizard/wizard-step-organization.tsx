"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Globe, RefreshCw } from "lucide-react";
import type { OrganizationWizardFormState } from "./types";

interface WizardStepOrganizationProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function WizardStepOrganization({
  form,
  errors,
  onChange,
}: WizardStepOrganizationProps) {
  const handleNameChange = (name: string) => {
    const updates: Partial<OrganizationWizardFormState> = { name };
    if (!form.slugEditedManually) {
      updates.slug = slugify(name);
    }
    onChange(updates);
  };

  const handleSlugChange = (slug: string) => {
    onChange({
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      slugEditedManually: true,
    });
  };

  const handleRegenerateSlug = () => {
    onChange({
      slug: slugify(form.name),
      slugEditedManually: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Organization Details</h3>
        <p className="mt-1 text-sm text-slate-600">
          Enter the essential identity details for the new tenant workspace.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Organization Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-900">
            Organization Name <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1.5 relative">
            <Input
              type="text"
              placeholder="e.g. Acme Corporation & Sons (India)"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={errors.name ? "border-rose-500 pr-10" : ""}
            />
          </div>
          {errors.name ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.name}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              The primary display name shown across the workspace (2–160 characters).
            </p>
          )}
        </div>

        {/* Legal Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Legal Entity Name
          </label>
          <div className="mt-1.5">
            <Input
              type="text"
              placeholder="e.g. Acme Corporation India Private Limited"
              value={form.legalName}
              onChange={(e) => onChange({ legalName: e.target.value })}
              className={errors.legalName ? "border-rose-500" : ""}
            />
          </div>
          {errors.legalName ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.legalName}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Optional registered business name for contracts and invoicing. Defaults to Organization Name if left blank.
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Website URL
          </label>
          <div className="mt-1.5 relative">
            <Globe className="absolute left-3 top-2.5 size-4 text-slate-600" />
            <Input
              type="url"
              placeholder="https://example.com"
              value={form.website}
              onChange={(e) => onChange({ website: e.target.value })}
              className={`pl-9 ${errors.website ? "border-rose-500" : ""}`}
            />
          </div>
          {errors.website ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.website}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Official company website (e.g. https://acme.com).
            </p>
          )}
        </div>

        {/* Slug */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-900">
              Workspace Slug <span className="text-rose-600">*</span>
            </label>
            {form.slugEditedManually && (
              <button
                type="button"
                onClick={handleRegenerateSlug}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <RefreshCw className="size-3" /> Auto-sync from name
              </button>
            )}
          </div>
          <div className="mt-1.5 flex rounded-lg border bg-slate-50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary overflow-hidden">
            <span className="inline-flex items-center px-3 text-xs text-slate-600 bg-slate-100 border-r select-none">
              app.symphowork.com/
            </span>
            <input
              type="text"
              placeholder="acme-corp"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="flex-1 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
          {errors.slug ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.slug}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Unique identifier used in URLs. Lowercase letters, numbers, and hyphens only (no spaces).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
