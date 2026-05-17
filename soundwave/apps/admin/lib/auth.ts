// ─── Hardcoded admin credentials (iteration 1 only) ──────────────────────────
// TODO iteration 2: replace with database lookup + bcrypt.compare() and
// HTTP-only session cookie — never store plain-text passwords in source code.

export const ADMIN_CREDENTIALS = {
  email:    "admin@soundwave.com",
  password: "admin123",
} as const;

// ─── verifyAdminLogin ─────────────────────────────────────────────────────────

export function verifyAdminLogin(email: string, password: string): boolean {
  return (
    email    === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  );
}
