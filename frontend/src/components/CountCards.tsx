type CountCardsProps = {
  counts?: Record<string, number | null>;
};

const COUNT_CARDS = [
  ["Songs", "songs"],
  ["Artists", "artists"],
  ["Albums", "albums"],
  ["Users", "users"],
  ["Playlists", "playlists"],
] as const;

export function CountCards({ counts }: CountCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {COUNT_CARDS.map(([label, key]) => (
        <div
          className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
          key={key}
        >
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {counts?.[key] ?? "-"}
          </p>
        </div>
      ))}
    </section>
  );
}
