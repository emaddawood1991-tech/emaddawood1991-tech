// Role templates (stage S5). A template is a named, documented preset that maps onto the four enforced system roles
// (admin / supervisor / reception / clinician) plus department and clinical-service authorization.
// Templates do NOT change what any role may do: that matrix lives in perms.js and every API route checks it on the server.
// Clinical service authorization (staff_services) stays separate: no template, and not administrator status, grants it.

export const ROLE_TEMPLATES = [
  { key: 'super_admin', name: 'Super Administrator', name_ar: 'مدير النظام', base_role: 'admin', needs_department: false, department_names: [],
    summary: 'Full system administration: staff, settings, security, reports, audit. Does not deliver treatment unless separately authorized.' },
  { key: 'clinic_manager', name: 'Clinic Manager', name_ar: 'مدير العيادة', base_role: 'supervisor', needs_department: false, department_names: [],
    summary: 'Runs the floor: all departments, rooms, queue priority, corrections, reports. No system configuration or account administration.' },
  { key: 'receptionist', name: 'Receptionist', name_ar: 'موظف الاستقبال', base_role: 'reception', needs_department: false, department_names: [],
    summary: 'Registers patients, books and checks in, manages the queue. No documentation, reports, audit or configuration.' },
  { key: 'physiotherapist', name: 'Physiotherapist', name_ar: 'أخصائي علاج طبيعي', base_role: 'clinician', needs_department: true, department_names: ['Physiotherapy'],
    summary: 'Treats and documents patients of the Physiotherapy department, only for the services they are authorized to deliver.' },
  { key: 'orthopedic_doctor', name: 'Orthopedic Doctor', name_ar: 'طبيب عظام', base_role: 'clinician', needs_department: true, department_names: ['Orthopedics'],
    summary: 'Consults and documents for the Orthopedics department, only for the services they are authorized to deliver.' },
  { key: 'general_practitioner', name: 'General Practitioner', name_ar: 'طبيب عام', base_role: 'clinician', needs_department: true, department_names: ['General Medicine'],
    summary: 'Consults and documents for the General Medicine department, only for the services they are authorized to deliver.' },
  { key: 'other_clinical', name: 'Other authorized clinical staff', name_ar: 'كادر سريري مخوّل آخر', base_role: 'clinician', needs_department: true, department_names: [],
    summary: 'Any other clinician (for example Neurological Rehabilitation, Sports Injury, Rehabilitation) within their own department and authorized services.' },
];
export const TEMPLATE_KEYS = ROLE_TEMPLATES.map((t) => t.key);
export const templateByKey = (k) => ROLE_TEMPLATES.find((t) => t.key === k) || null;

/** The template to show for an account: the stored one, or the closest default for accounts created before templates existed. */
export function effectiveTemplate(u) {
  if (u.role_template && templateByKey(u.role_template)) return u.role_template;
  return { admin: 'super_admin', supervisor: 'clinic_manager', reception: 'receptionist', clinician: 'other_clinical' }[u.role] || null;
}

/**
 * Checks a template choice against the role/department being saved. Returns { role } to apply, or { fields } with messages.
 * `getDeptName(id)` resolves a department id to its name.
 */
export function applyTemplate(key, { role, department_id }, getDeptName) {
  const t = templateByKey(key);
  if (!t) return { fields: { role_template: `Choose one of: ${TEMPLATE_KEYS.join(', ')}.` } };
  if (role !== undefined && role !== t.base_role) return { fields: { role_template: `${t.name} is the “${t.base_role}” role; the selected role is “${role}”.` } };
  const dep = department_id === '' || department_id == null ? null : Number(department_id);
  if (t.needs_department && !dep) return { fields: { department_id: `${t.name} must belong to a department.` } };
  if (!t.needs_department && dep && t.base_role !== 'clinician') return { fields: { department_id: `${t.name} works across all departments; leave the department empty.` } };
  if (t.department_names.length && dep) {
    const n = getDeptName(dep);
    if (n && !t.department_names.includes(n)) return { fields: { department_id: `${t.name} belongs to ${t.department_names.join(' / ')}. For another department use “Other authorized clinical staff”.` } };
  }
  return { role: t.base_role };
}

/** Lists every /api route with the permission its guard requires — read from the real router, so the documentation cannot drift from enforcement. */
export function listRoutes(app) {
  const out = [];
  const walk = (stack) => {
    for (const layer of stack || []) {
      const r = layer.route; if (!r || typeof r.path !== 'string') continue;
      for (const method of Object.keys(r.methods || {})) {
        const g = (r.stack || []).map((s) => s.handle).find((h) => h && h.isGuard);
        out.push({ method: method.toUpperCase(), path: r.path, guarded: !!g, permission: g ? g.perm : null });
      }
    }
  };
  walk(app.router?.stack);
  return out.filter((r) => r.path.startsWith('/api')).sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}
