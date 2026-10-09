"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import { COUNTRIES, type OrganizationWizardFormState } from "./types";

interface WizardStepContactAddressProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}

export function WizardStepContactAddress({
  form,
  errors,
  onChange,
}: WizardStepContactAddressProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Organization Contact & Headquarters / Registered Address
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Official communication channels and registered legal address for this organization.
        </p>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
        <Building2 className="size-5 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-950">Official Organization Identity</p>
          <p className="mt-0.5 text-blue-800">
            This contact information represents the organization entity (such as{" "}
            <span className="font-mono">contact@company.com</span>). The individual Owner login and invitation will be configured in the next step.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b pb-1.5">
          Official Contact Information
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Official Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              Official Organization Email
            </label>
            <div className="mt-1.5 relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-slate-600" />
              <Input
                type="email"
                placeholder="contact@company.com"
                value={form.contactEmail}
                onChange={(e) => onChange({ contactEmail: e.target.value })}
                className={`pl-9 ${errors.contactEmail ? "border-rose-500" : ""}`}
              />
            </div>
            {errors.contactEmail ? (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.contactEmail}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-600">
                Optional. If left blank, will default to the Owner email.
              </p>
            )}
          </div>

          {/* Official Phone */}
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              Official Organization Phone
            </label>
            <div className="mt-1.5 relative">
              <Phone className="absolute left-3 top-2.5 size-4 text-slate-600" />
              <Input
                type="tel"
                placeholder="+919876543210"
                value={form.contactPhone}
                onChange={(e) => onChange({ contactPhone: e.target.value })}
                className={`pl-9 ${errors.contactPhone ? "border-rose-500" : ""}`}
              />
            </div>
            {errors.contactPhone ? (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.contactPhone}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-600">
                International format: e.g. +919876543210 (digits only, optional leading +).
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b pb-1.5 flex items-center gap-2">
          <MapPin className="size-3.5 text-slate-600" /> Headquarters / Registered Address
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Address Line 1 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-900">
              Address Line 1
            </label>
            <div className="mt-1.5">
              <Input
                type="text"
                placeholder="Building name, Street address, Suite / Floor"
                value={form.addressLine1}
                onChange={(e) => onChange({ addressLine1: e.target.value })}
                className={errors.addressLine1 ? "border-rose-500" : ""}
              />
            </div>
            {errors.addressLine1 && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-900">
              Address Line 2
            </label>
            <div className="mt-1.5">
              <Input
                type="text"
                placeholder="Area, Landmark, District (optional)"
                value={form.addressLine2}
                onChange={(e) => onChange({ addressLine2: e.target.value })}
                className={errors.addressLine2 ? "border-rose-500" : ""}
              />
            </div>
            {errors.addressLine2 && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.addressLine2}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              City
            </label>
            <div className="mt-1.5">
              <Input
                type="text"
                placeholder="e.g. Mumbai, New York"
                value={form.city}
                onChange={(e) => onChange({ city: e.target.value })}
                className={errors.city ? "border-rose-500" : ""}
              />
            </div>
            {errors.city && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.city}</p>
            )}
          </div>

          {/* State / Province */}
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              State / Province
            </label>
            <div className="mt-1.5">
              <Input
                type="text"
                placeholder="e.g. Maharashtra, California"
                value={form.state}
                onChange={(e) => onChange({ state: e.target.value })}
                className={errors.state ? "border-rose-500" : ""}
              />
            </div>
            {errors.state && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.state}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              Country
            </label>
            <div className="mt-1.5">
              <select
                value={form.country}
                onChange={(e) => onChange({ country: e.target.value })}
                className={`w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.country ? "border-rose-500" : "border-slate-200"
                }`}
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {errors.country && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.country}</p>
            )}
          </div>

          {/* Postal / ZIP Code */}
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              Postal / ZIP Code
            </label>
            <div className="mt-1.5">
              <Input
                type="text"
                placeholder="e.g. 400001 or 10001"
                value={form.postalCode}
                onChange={(e) => onChange({ postalCode: e.target.value })}
                className={errors.postalCode ? "border-rose-500" : ""}
              />
            </div>
            {errors.postalCode ? (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.postalCode}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-600">
                Alphanumeric postal code (3–20 characters).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
