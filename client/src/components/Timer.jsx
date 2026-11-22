export default function Timer({ display, frozen }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`font-mono text-5xl font-bold tabular-nums ${frozen ? 'text-blue-700' : 'text-green-700'}`}
      >
        {display}
      </span>
      {frozen && (
        <span className="rounded-full bg-blue-700 px-3 py-1 text-sm font-semibold text-white">Frozen</span>
      )}
    </div>
  );
}
