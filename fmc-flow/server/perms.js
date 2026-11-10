// Role → permission matrix. Authorization to deliver a *service* is separate (staff_services).
const R = { admin: 'admin', supervisor: 'supervisor', reception: 'reception', clinician: 'clinician' };
const ALL = Object.values(R);

export const PERMS = {
  'config.manage': ['admin'],
  'patients.read': ALL,
  'patients.write': ['admin', 'reception'],
  'visit.manage': ['admin', 'supervisor', 'reception'],
  'queue.view': ALL,
  'queue.call': ['admin', 'supervisor', 'reception', 'clinician'],
  'queue.priority': ['admin', 'supervisor', 'reception'],
  'queue.cancel': ['admin', 'supervisor', 'reception'],
  'room.assign': ['admin', 'supervisor', 'reception', 'clinician'],
  'room.cleaning': ['admin', 'supervisor', 'reception', 'clinician'],
  'room.maintenance': ['admin', 'supervisor'],
  'session.run': ['admin', 'supervisor', 'clinician'],
  'availability.self': ALL,
  'availability.others': ['admin', 'supervisor'],
  'corrections.request': ['admin', 'supervisor', 'reception', 'clinician'],
  'corrections.approve': ['admin', 'supervisor'],
  'reports.view': ['admin', 'supervisor'],
  'audit.view': ['admin', 'supervisor'],
  'health.view': ['admin'],
  'schedule.view': ALL,
  'schedule.manage': ['admin', 'supervisor', 'reception'],
  'schedule.block': ['admin', 'supervisor'],
  'breakglass.use': ['supervisor', 'clinician'], // read-only emergency access outside the person's department; off until an administrator enables it
  'breakglass.review': ['admin'],
};

export const can = (user, perm) => !!user && (PERMS[perm] || []).includes(user.role);

/** Department scope: null = all departments; otherwise the list of department ids the person works in (their own plus any extra ones an administrator granted). */
export const deptScope = (user) => {
  if (user.role === 'admin' || !user.department_id) return null;
  return [...new Set([user.department_id, ...(user.department_ids || [])].map(Number))];
};
/** The same scope as JSON for SQL (`col IN (SELECT value FROM json_each(?))`), or null for everyone. */
export const deptJson = (user) => { const s = deptScope(user); return s == null ? null : JSON.stringify(s); };
export const inScope = (user, depId) => { const s = deptScope(user); return s == null || s.includes(Number(depId)); };
