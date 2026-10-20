export type NavItemDef={label:string;href:string;iconKey:string};
export type NavGroupDef={title?:string;items:NavItemDef[]};
export const ICON_MAP: Record<string, string> = {
  overview: "LayoutDashboard",
  people: "UsersRound",
  attendance: "Clock3",
  leave: "CalendarCheck2",
  approvals: "ClipboardCheck",
  expenses: "ReceiptText",
  payroll: "Banknote",
  payslips: "FileText",
  recruitment: "BriefcaseBusiness",
  work: "ListTodo",
  chat: "MessageCircle",
  billing: "Banknote",
  reports: "BarChart3",
  departments: "Building2",
  settings: "Settings2",
  workflows: "Settings2",
  // Platform Console icons
  organizations: "Building2",
  provisioning: "Gauge",
  plans: "CreditCard",
  subscriptions: "WalletCards",
  usage: "Gauge",
  analytics: "BarChart3",
  features: "ToggleLeft",
  support: "LifeBuoy",
  health: "ShieldCheck",
  configuration: "Settings2",
  users: "UsersRound",
  audit: "Activity",
};

