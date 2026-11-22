const STYLES = {
  posted: 'bg-blue-600 text-white',
  claimed: 'bg-amber-400 text-gray-900',
  collected: 'bg-purple-600 text-white',
  delivered: 'bg-green-600 text-white',
  expired: 'bg-gray-500 text-white',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${
        STYLES[status] || 'bg-gray-500 text-white'
      }`}
    >
      {status}
    </span>
  );
}
