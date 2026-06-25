'use client';

// app/components/LogoutButton.tsx
// Small reusable sign-out button. Posts to /api/logout, which clears the
// session and redirects to /login. Drop it onto any page.

export default function LogoutButton() {
  async function handleLogout() {
    // The route responds with a redirect; following it lands us on /login.
    const res = await fetch('/api/logout', { method: 'POST' });
    // fetch follows the redirect; navigate to its final URL.
    window.location.href = res.url || '/login';
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-muted text-sm hover:text-text"
    >
      Sign out
    </button>
  );
}
