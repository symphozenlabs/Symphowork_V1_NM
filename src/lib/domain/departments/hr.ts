export function isHrDepartment(dept?: { code?: string | null; name?: string | null } | null): boolean {
  if (!dept) return false;
  const code = (dept.code || "").trim().toUpperCase();
  const name = (dept.name || "").trim().toLowerCase();
  return code === "HR" || name === "human resources" || name === "hr" || name.startsWith("human resource");
}

