import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'rescue-surplus-role-state';
export const ROLES = ['donor', 'receiver', 'volunteer', 'admin'];

// Defaults are real ids from server/db/seed.js.
const DEFAULTS = { role: 'donor', receiverId: 'R1', volunteerId: 'V1', donorId: 'D1' };

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return DEFAULTS;
    return {
      role: ROLES.includes(parsed.role) ? parsed.role : DEFAULTS.role,
      receiverId: typeof parsed.receiverId === 'string' ? parsed.receiverId : DEFAULTS.receiverId,
      volunteerId: typeof parsed.volunteerId === 'string' ? parsed.volunteerId : DEFAULTS.volunteerId,
      donorId: typeof parsed.donorId === 'string' ? parsed.donorId : DEFAULTS.donorId,
    };
  } catch {
    return DEFAULTS;
  }
}

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode, quota). The role still works for this session.
    }
  }, [state]);

  const setRole = useCallback((role) => {
    if (ROLES.includes(role)) setState((s) => ({ ...s, role }));
  }, []);

  const value = useMemo(
    () => ({
      currentRole: state.role,
      setRole,
      receiverId: state.receiverId,
      volunteerId: state.volunteerId,
      donorId: state.donorId,
    }),
    [state, setRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleContext() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRoleContext must be used inside RoleProvider');
  return ctx;
}
