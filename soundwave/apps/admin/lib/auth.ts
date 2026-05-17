// ─── auth.ts ──────────────────────────────────────────────────────────────────
//
// Hardcoded admin credentials for iteration 1.
//
// WHY is this okay for iteration 1 but NOT for production?
//
// Hardcoding a password in source code means anyone with access to the repo
// can read it. In iteration 2 this will be replaced with:
//   • A database row where the password is stored as a bcrypt hash
//     (bcrypt is a one-way hashing algorithm — even if the database leaks,
//     the original password cannot be recovered directly)
//   • An HTTP-only cookie holding a signed session token (the server issues
//     it after a successful login, the browser stores it, and it is never
//     readable by JavaScript — so XSS attacks can't steal it)
//   • Server-side session validation on every protected API route

export const ADMIN_CREDENTIALS = {
  email:    "admin@soundwave.com",
  password: "admin123",
} as const;

// ─── verifyAdminLogin ─────────────────────────────────────────────────────────
//
// Returns true if both the email and password match exactly.
// In iteration 2 this will call bcrypt.compare() to check a hashed password,
// never a plain-text string comparison like this one.
export function verifyAdminLogin(email: string, password: string): boolean {
  return (
    email    === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  );
}
