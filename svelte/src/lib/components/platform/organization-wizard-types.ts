export interface PlanSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number | null;
  annualPriceCents: number | null;
  currency: string;
  trialDays: number;
  maxUsers: number | null;
  maxStorageBytes: number | null;
  billingInterval: string;
  active: boolean;
}

export interface OrganizationWizardFormState {
  // Step 1: Organization
  name: string;
  legalName: string;
  slug: string;
  slugEditedManually: boolean;
  website: string;

  // Step 2: Contact & Address
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  // Step 3: Owner
  ownerEmail: string;
  ownerFullName: string;

  // Step 4: Plan & Subscription
  planId: string;
  billingCycle: "monthly" | "annual";

  // Step 5: Regional
  timezone: string;
  currency: string;
  dateFormat: string;
}

export type WizardStepId = 1 | 2 | 3 | 4 | 5 | 6;

export interface WizardStepDefinition {
  id: WizardStepId;
  title: string;
  shortTitle: string;
  description: string;
}

export const WIZARD_STEPS: WizardStepDefinition[] = [
  {
    id: 1,
    title: "Organization",
    shortTitle: "Organization",
    description: "Name, legal entity, slug, website",
  },
  {
    id: 2,
    title: "Contact & Address",
    shortTitle: "Contact & Address",
    description: "Official contact and registered address",
  },
  {
    id: 3,
    title: "Owner",
    shortTitle: "Owner",
    description: "Organization Owner details",
  },
  {
    id: 4,
    title: "Plan",
    shortTitle: "Plan",
    description: "Subscription and billing",
  },
  {
    id: 5,
    title: "Regional",
    shortTitle: "Regional",
    description: "Timezone, currency, date format",
  },
  {
    id: 6,
    title: "Review",
    shortTitle: "Review",
    description: "Verify all details",
  },
];

export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "United Arab Emirates",
  "Germany",
  "France",
  "Japan",
  "Netherlands",
  "Ireland",
  "New Zealand",
  "South Africa",
  "Brazil",
  "Mexico",
  "Saudi Arabia",
  "Malaysia",
  "Philippines",
  "Indonesia",
];

export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+05:30)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+08:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST, UTC+00:00)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET, UTC+01:00)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET, UTC+01:00)" },
  { value: "America/New_York", label: "America/New_York (EST, UTC-05:00)" },
  { value: "America/Chicago", label: "America/Chicago (CST, UTC-06:00)" },
  { value: "America/Denver", label: "America/Denver (MST, UTC-07:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST, UTC-08:00)" },
  { value: "America/Toronto", label: "America/Toronto (EST, UTC-05:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST, UTC+10:00)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+09:00)" },
];

export const CURRENCIES = [
  { value: "INR", label: "INR (₹) — Indian Rupee" },
  { value: "USD", label: "USD ($) — US Dollar" },
  { value: "EUR", label: "EUR (€) — Euro" },
  { value: "GBP", label: "GBP (£) — British Pound" },
  { value: "AED", label: "AED (د.إ) — UAE Dirham" },
  { value: "SGD", label: "SGD ($) — Singapore Dollar" },
  { value: "CAD", label: "CAD ($) — Canadian Dollar" },
  { value: "AUD", label: "AUD ($) — Australian Dollar" },
];

export const DATE_FORMATS = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY (e.g. 31/12/2026)" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY (e.g. 12/31/2026)" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD (e.g. 2026-12-31)" },
];
