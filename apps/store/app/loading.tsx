export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-gray-200" />

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-gray-200"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="aspect-square animate-pulse bg-gray-200" />

            <div className="flex flex-col gap-3 p-4">
              <div className="h-4 w-16 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="mt-1 flex items-center justify-between">
                <div className="h-5 w-14 animate-pulse rounded bg-gray-200" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
