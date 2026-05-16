export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-24">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900">
        Soundwave <span className="text-emerald-600">Admin</span>
      </h1>
      <p className="text-lg text-gray-500">
        Manage tracks, artists, and users from one place.
      </p>
      <span className="rounded-full bg-emerald-50 px-4 py-1 text-sm font-medium text-emerald-700">
        Running on port 3001
      </span>
    </main>
  );
}
