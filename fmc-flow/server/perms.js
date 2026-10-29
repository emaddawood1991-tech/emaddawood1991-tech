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
};

export const can = (user, perm) => !!user && (PERMS[perm] || []).includes(user.role);

/** Department scope: null = all departments; otherwise a single department id. */
export const deptScope = (user) =>
  user.role === 'admin' || !user.department_id ? null : user.department_id;
