import { ROLES, useRoleContext } from '../context/RoleContext.jsx';

export default function RoleSwitch() {
  const { currentRole, setRole } = useRoleContext();

  return (
    <label className="flex items-center justify-between gap-3 text-base font-semibold text-gray-800">
      <span>Role</span>
      <select
        value={currentRole}
        onChange={(e) => setRole(e.target.value)}
        className="min-h-[48px] min-w-[160px] rounded-lg border-2 border-green-600 bg-white px-3 text-base"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}
