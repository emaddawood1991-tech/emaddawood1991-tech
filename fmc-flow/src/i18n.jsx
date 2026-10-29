import { createContext, useContext, useEffect, useState } from 'react';

const EN = {
  appName: 'FMC Patient Flow', tagline: 'Ideal Care', signIn: 'Sign in', username: 'Username', password: 'Password', signOut: 'Sign out',
  demoNote: 'Development build — synthetic data only.',
  dashboard: 'Dashboard', visits: 'Visits', queue: 'Queue', rooms: 'Rooms', sessions: 'Sessions', corrections: 'Corrections', search: 'Search', reports: 'Reports', settings: 'Settings', system: 'System',
  waiting: 'Waiting', inTreatment: 'In treatment', roomsFree: 'Rooms free', staffAvail: 'Staff available', callNext: 'Call next', department: 'Department', allDepartments: 'All departments',
  patient: 'Patient', mrn: 'EMR', clinician: 'Clinician', service: 'Service', room: 'Room', station: 'Station / bed', status: 'Status', actions: 'Actions', arrival: 'Arrival', waited: 'Waited', priority: 'Priority',
  normal: 'Normal', high: 'High', urgent: 'Urgent', reason: 'Reason', cancel: 'Cancel', save: 'Save', confirm: 'Confirm', close: 'Close', add: 'Add', edit: 'Edit', back: 'Back',
  checkIn: 'Check in', checkOut: 'Check out', newPatient: 'New patient', searchPatient: 'Search name, EMR or ID', name: 'Name', nameAr: 'Name (Arabic)', appointment: 'Appointment', walkIn: 'Walk-in',
  assignRoom: 'Assign room', enterRoom: 'Confirm entry', transfer: 'Transfer', exitRoom: 'Exit room', startSession: 'Start treatment', pause: 'Pause', resume: 'Resume', complete: 'Complete', timeline: 'Timeline',
  requestCorrection: 'Request correction', correctedTime: 'Corrected time', originalTime: 'Original time', approve: 'Approve', reject: 'Reject', pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
  AVAILABLE: 'Available', OCCUPIED: 'Occupied', CLEANING: 'Cleaning', MAINTENANCE: 'Maintenance', OUT_OF_SERVICE: 'Out of service', BUSY: 'Busy', ON_BREAK: 'On break', OFF_DUTY: 'Off duty', UNAVAILABLE: 'Unavailable',
  WAITING: 'Waiting', CALLED: 'Called', IN_ROOM: 'In room', DONE: 'Done', ACTIVE: 'Active', PAUSED: 'Paused', COMPLETED: 'Completed', OPEN: 'Open', CHECKED_OUT: 'Checked out',
  noData: 'Nothing here yet.', loading: 'Loading…', myStatus: 'My status', maintenance: 'Maintenance', restore: 'Restore', history: 'History', capacity: 'Capacity', stations: 'Stations',
  serverTime: 'Server time', synced: 'Synced', offline: 'Cannot reach the server. Showing last known data — actions are paused until the connection returns. No times are recorded offline.',
  stale: 'Last synced', session: 'Session', duration: 'Duration', total: 'Total', totalNoOverlap: 'Total (no overlap)', sumSessions: 'Sum of sessions',
  from: 'From', to: 'To', export: 'Export CSV', avgWait: 'Avg wait (min)', transfers: 'Transfers', maintEvents: 'Maintenance events', byService: 'By service', byRoom: 'By room', minutes: 'Minutes',
  health: 'System health', audit: 'Audit log', backup: 'Backup', lastBackup: 'Last backup', never: 'Never', database: 'Database', connected: 'Connected', failedOps: 'Failed operations (24h)', syncProblems: 'Sync problems (24h)', recentErrors: 'Recent errors',
  departments: 'Departments', services: 'Services', staff: 'Staff', policy: 'Policy', prefix: 'Queue prefix', startNo: 'Start number', resetDaily: 'Reset daily', cleaningAfter: 'Cleaning after use', active: 'Active',
  role: 'Role', schedule: 'Schedule', authorizedServices: 'Authorized services', policyApproval: 'Corrections need approval', policyTransfer: 'Transfer reason required',
  unauthorizedNote: 'Availability never grants authorization — services need explicit authorization.',
  from_room: 'From', to_room: 'To', timelineTitle: 'Visit timeline', events: 'Events', occupancy: 'Room occupancy', by: 'By',
  scheduled: 'Scheduled', newAppt: 'New appointment', when: 'When', openVisits: 'Open visits', none: '—', yes: 'Yes', no: 'No', lang: 'العربية',
  ev_APPOINTMENT: 'Appointment time', ev_ARRIVED: 'Patient arrived', ev_QUEUE_ENTERED: 'Entered queue', ev_QUEUE_CALLED: 'Called', ev_ROOM_ASSIGNED: 'Room assigned', ev_ROOM_ENTERED: 'Entered room',
  ev_TREATMENT_STARTED: 'Treatment started', ev_TREATMENT_PAUSED: 'Treatment paused', ev_TREATMENT_RESUMED: 'Treatment resumed', ev_TREATMENT_COMPLETED: 'Treatment completed',
  ev_ROOM_EXITED: 'Exited room', ev_ROOM_TRANSFERRED: 'Room transfer', ev_CLINIC_DEPARTED: 'Left the clinic', ev_CORRECTION_REQUESTED: 'Correction requested', ev_CORRECTION_APPLIED: 'Correction applied', ev_CORRECTION_REJECTED: 'Correction rejected',
  mrnLabel: 'Medical Record Number (EMR)', mrnAuto: 'Generate automatically', mrnManual: 'Enter existing EMR', mrnAutoHint: 'A new EMR is assigned when you save.',
  mrnManualHint: 'Letters, numbers, “-” or “/”, 3–30 characters. An EMR already in use is never overwritten.', fullNameEn: 'Full name (English)', fullNameAr: 'Full name (Arabic)',
  dob: 'Date of birth', gender: 'Gender', contactNumber: 'Contact number', phoneHint: 'UAE: 050 123 4567. Other countries: include the code, e.g. +44 7700 900123.',
  patientDetails: 'Patient details', visitDetails: 'Visit', registerPatient: 'Register patient', deptRequired: 'Select a department to check the patient in.', selectDeptFirst: 'Select a department first',
  optionalWord: 'optional', requiredWord: 'required', savePatient: 'Save patient', saveCheckIn: 'Save & check in', saving: 'Saving…', patientSaved: 'Patient saved', checkedInAs: 'checked in, queue number',
  useThisPatient: 'Use this patient', registerAnyway: 'This is a different person — register anyway', possibleDup: 'Possible duplicate', fixErrors: 'Please correct the highlighted fields.',
  noResults: 'No matching patient. Use “New patient” to register one.', openVisitNote: 'Visit open', mrnTaken: 'This EMR already belongs to', genderOptions: 'Gender options', genderCode: 'Code', labelEn: 'English', labelAr: 'Arabic',
  policyNameAr: 'Arabic name required at registration', policyPhone: 'Contact number required at registration', policyService: 'Service required at check-in', patientSelected: 'Selected patient', changePatient: 'Change',
  notAuthSvc: 'You are not authorized to provide “{svc}”.', noServicesFor: 'No services are configured for {dept}.', noServicesAdmin: 'Add services under Settings → Services.', noServicesOther: 'Ask an administrator to add services under Settings → Services.',
  noAuthClinician: 'No authorized clinician is available for this service.', noAuthAdmin: 'Please assign an authorized clinician in Settings → Staff.', noAuthOther: 'Ask an administrator to assign an authorized clinician in Settings → Staff.',
  notAuthAny: 'You are not authorized to provide any service in {dept}.', notAuthAnyHelp: 'Ask an administrator to grant your authorization in Settings → Staff.',
  needRoom: 'Assign a room to the patient first.', needEntry: 'Confirm that the patient has entered the room before starting treatment.', noDeptVisit: 'This visit has no department. Check the patient in to a department first.',
  startOnBehalf: 'Start on behalf of', onBehalfNote: 'The session is recorded for the selected clinician; your name is logged as the person who started it.', startingAs: 'Clinician', openSettings: 'Open Settings',
  notAuthorizedTag: 'not authorized', noClinicianTag: 'no authorized clinician', treatmentStarted: 'Treatment started', chooseService: 'Choose a service', authorizedClinicians: 'Authorized clinicians',
  noAuthorizedChip: 'No authorized clinician', authHelp: 'Authorization is granted per person under Staff → Edit. Administrator and supervisor roles have no clinical authorization unless you assign it explicitly.',
  authNote: 'Availability is shown for information only; it never grants authorization.', serviceDept: 'Department',
  requiredForCheckIn: 'required to check in', minShort: 'min', durationMin: 'Treatment duration (minutes)', durationHint: 'Allowed {min}–{max} minutes. Default {def}.', durationFixed: 'Fixed at {def} minutes by clinic policy.', durationInvalid: 'Enter whole minutes between {min} and {max}.',
  summaryPatient: 'Patient', summaryRoom: 'Room', planned: 'Planned', remaining: 'Remaining', scheduledEnd: 'Scheduled end', actualEnd: 'Actual end', roomEntry: 'Room entry', roomExit: 'Room exit', treatmentStart: 'Treatment start',
  waitBefore: 'Waiting before room', waitInRoom: 'Waiting in room', waitTotal: 'Total waiting', totalVisit: 'Total visit', timing: 'Timing', hideTiming: 'Hide timing', arrivalAt: 'Arrival',
  TIMER_RUNNING: 'Running', TIMER_PAUSED: 'Timer paused', TIMER_ELAPSED: 'Time elapsed', TIMER_DONE: 'Completed', endEarly: 'End early', confirmEndEarly: 'Confirm: end early', confirmCompletion: 'Confirm completion', continuedEndNow: 'Treatment continued — end now',
  elapsedNotice: 'Scheduled treatment time has elapsed. Confirm completion to record the treatment as finished.', elapsedToast: 'Scheduled time elapsed', overtime: 'Overtime', pauseTimer: 'Pause timer', resumeTimer: 'Resume timer',
  completionKind_FULL: 'Completed at scheduled time (confirmed)', completionKind_OVERRUN: 'Overran the plan (confirmed)', completionKind_EARLY: 'Ended early (confirmed)', completionKind_AUTO: 'Auto-closed (not verified)',
  timerAutoClose: 'Automatically close treatment when the scheduled time elapses (recorded as NOT clinician-verified; the room is never freed automatically)', allowOverride: 'Clinicians may change duration', minMin: 'Min minutes', maxMin: 'Max minutes', defaultMin: 'Default minutes',
  repWaitBefore: 'Avg waiting before room', repWaitIn: 'Avg waiting in room', repWaitTotal: 'Avg total waiting', repPlanned: 'Avg planned minutes', repActual: 'Avg confirmed minutes', repOverruns: 'Overruns', repEarly: 'Early completions', repFull: 'Completed on time', repAuto: 'Auto-closed (unverified)', repOcc: 'Avg room occupancy', repVisit: 'Avg total visit', filters: 'Filters', apply: 'Apply', patientFilter: 'Patient name or EMR', allRooms: 'All rooms', allServices: 'All services', allClinicians: 'All clinicians', timeLeft: 'left',
  ev_TIMER_ELAPSED: 'Scheduled time elapsed',
  treatmentboard: 'Treatment Board', dailyschedule: 'Daily Schedule',
  dsToday: 'Today', dsPrev: 'Previous day', dsNext: 'Next day', dsAllDepts: 'All departments', dsAllStaff: 'All staff', dsAllCats: 'All categories', dsSearch: 'Search patient, EMR or phone',
  dsAddAppt: 'Add Appointment', dsAddRow: 'Add Row', dsAddCol: 'Add Column', dsLayout: 'Manage layout', dsBlock: 'Block time', dsNoSchedule: 'No schedule is set up yet.',
  dsSetupHelp: 'Create a timetable for each department from your active staff. You can change rows, times and intervals afterwards.', dsSetup: 'Set up from active staff', dsAskAdmin: 'Ask an administrator to set up the schedule.',
  dsStart: 'Start', dsEnd: 'End', dsInterval: 'Interval (minutes)', dsFindPatient: 'Find patient (EMR, English or Arabic name, phone)', dsNewPatient: 'New patient', dsSelected: 'Selected patient', dsChange: 'Change',
  dsDate: 'Date', dsTime: 'Time', dsCategory: 'Category', dsDuration: 'Duration (minutes)', dsSuggested: 'Suggested from the {src}', dsSrcCategory: 'category', dsSrcService: 'service', dsSrcDefault: 'clinic default',
  dsNotes: 'Notes', dsRepeat: 'Repeat', dsNoRepeat: 'Does not repeat', dsDaily: 'Daily', dsWeekly: 'Weekly', dsOccurrences: 'Occurrences (max 52)', dsUntil: 'Until (date)', dsSkipConflicts: 'Skip dates that conflict',
  dsSave: 'Save appointment', dsSaved: 'Appointment saved', dsRow: 'Row / therapist', dsNoRow: '— none —', dsConflict: 'This booking conflicts', dsOverride: 'Override the blocked period', dsOverrideReason: 'Reason for the override (required)', dsOverrideNote: 'Only an administrator or an authorized supervisor can do this. It is recorded in the audit log.',
  dsDetails: 'Appointment', dsEdit: 'Edit', dsReschedule: 'Reschedule', dsCopy: 'Copy', dsCancelAppt: 'Cancel appointment', dsCancelReason: 'Cancellation reason (required)', dsConfirmCancel: 'Confirm cancellation', dsArrived: 'Mark arrived', dsHistory: 'History', dsClose: 'Close',
  dsStatus_SCHEDULED: 'Scheduled', dsStatus_ARRIVED: 'Arrived', dsStatus_CANCELLED: 'Cancelled', dsStatus_NO_SHOW: 'No-show', dsUnplaced: 'Appointments not on a row', dsSeries: 'Recurring series',
  dsBlocked: 'Blocked', dsBlock_BREAK: 'Break', dsBlock_LEAVE: 'Leave', dsBlock_MEETING: 'Meeting', dsBlock_MAINTENANCE: 'Maintenance', dsBlock_OTHER: 'Other', dsBlockWho: 'Applies to', dsWholeGroup: 'Whole timetable', dsRemoveBlock: 'Remove block', dsRemoveSeries: 'Remove the whole series', dsBlockSaved: 'Blocked period saved', dsBlockAffected: '{n} existing appointment(s) fall inside this period and were not changed.',
  dsGroup: 'Timetable group', dsStaffMember: 'Staff member (optional)', dsLabel: 'Label', dsLabelAr: 'Label (Arabic)', dsCapacity: 'Capacity (patients at once)', dsRowAdded: 'Row added', dsColAdded: 'Time column(s) added', dsSingleTime: 'One time', dsTimeRange: 'A range of times', dsColLabel: 'Label (optional)',
  dsHide: 'Hide', dsShow: 'Show', dsRemove: 'Remove', dsMoveUp: 'Move up', dsMoveDown: 'Move down', dsSyncStaff: 'Add missing active staff', dsAddGroup: 'Add timetable group', dsRowsOf: 'Rows', dsColsOf: 'Time columns', dsHidden: 'hidden', dsLayoutHelp: 'Hiding keeps everything. A row or column can be removed only when nothing depends on it; appointments are never deleted.', dsAdded: 'Added {n}',
  dsWaiting: 'Waiting list', dsCancellations: 'Cancellations', dsFollowUp: 'Follow-up calls', dsApproval: 'Approval calls', dsRejection: 'Rejections', dsForDoctor: 'For doctor', dsEvaluationList: 'Evaluation',
  dsAddWaiting: 'Add to waiting list', dsPrefClinician: 'Preferred clinician', dsPrefDate: 'Preferred date', dsPrefTime: 'Preferred time', dsContact: 'Contact status', dsBook: 'Book', dsRebook: 'Rebook',
  dsContact_NOT_CONTACTED: 'Not contacted', dsContact_CONTACTED: 'Contacted', dsContact_NO_ANSWER: 'No answer', dsContact_WILL_CALL_BACK: 'Will call back', dsContact_CONFIRMED: 'Confirmed',
  dsOriginal: 'Original appointment', dsReason: 'Reason', dsCancelledAt: 'Cancelled at', dsBy: 'By', dsResched: 'Rescheduling', dsResched_PENDING: 'Not rebooked', dsResched_REBOOKED: 'Rebooked',
  dsAddTask: 'Add task', dsAssignee: 'Assigned to', dsDue: 'Due', dsTaskStatus_OPEN: 'Open', dsTaskStatus_IN_PROGRESS: 'In progress', dsTaskStatus_DONE: 'Done', dsTaskStatus_CANCELLED: 'Cancelled', dsMarkDone: 'Mark done', dsTitle: 'Title', dsNoPatientOptional: 'Patient (optional)',
  dsNothing: 'Nothing here.', dsLoadErr: 'Could not load the schedule.', dsOnlyAdmin: 'Administrators only', dsCategories: 'Appointment categories', dsColor: 'Colour', dsDefaultMin: 'Default minutes', dsAllowOverride: 'May override blocked periods (supervisor)', dsMatches: '{n} match(es)',
  ev_OPERATIONAL_CHECKOUT: 'Operational check-out (automatic)', ev_DOCUMENTATION_SAVED: 'Documentation saved', ev_DOCUMENTATION_COMPLETE: 'Documentation complete', ev_DOCUMENTATION_INCOMPLETE: 'Documentation incomplete again',
  time: 'Time', treatment: 'Treatment', autoClosing: 'Scheduled time reached — the treatment is being stopped and checked out automatically.',
  schedYellow: 'Treatment started — documentation incomplete', schedOrange: 'Documentation complete', schedYellowShort: 'Documentation incomplete', schedOrangeShort: 'Documentation complete',
  docBtn: 'Documentation', docTitle: 'Clinical documentation', chiefComplaint: 'Chief complaint', diagnosisLabel: 'Diagnosis', procedureCpt: 'Procedure / CPT code', progressNote: 'Progress note',
  docSave: 'Save documentation', docSaved: 'Saved and valid', docSavedToast: 'Documentation saved', docCount: '{n} of 4 required fields complete', docUnsaved: 'You have unsaved changes. They do not count until you press Save.',
  docProb_EMPTY: 'Required — not completed', docProb_TOO_SHORT: 'Too short to count', docProb_FORMAT: 'Does not match the diagnosis format set by the clinic', docProb_CPT_NOT_APPROVED: 'Not currently an approved code',
  docNoCpt: 'No approved procedure codes yet. An administrator adds them in Settings → Procedure codes.', docReadOnly: 'Only the treating clinician can edit documentation. You can see which fields are complete, not the clinical text.',
  opCheckout: 'Operational check-out', opCheckoutAuto: 'automatic at the scheduled end — not clinical completion and not departure', opCheckoutManual: 'recorded when the treatment was ended', opCheckoutAutoShort: 'automatic',
  scheduleDay: 'Day', scheduleHelp: 'Yellow stays until all four documentation fields are saved and valid; orange appears automatically and returns to yellow if documentation becomes incomplete. Automatic check-out does not complete documentation.',
  cptCodes: 'Procedure codes', cptCode: 'Code', cptDesc: 'Description', cptMinutes: 'Default minutes', cptHelp: 'Only active codes listed here are accepted. FMC enters its own approved codes; none are supplied with the application.',
  docMinChars: 'Minimum characters for a documentation text field', diagnosisPattern: 'Diagnosis format (optional pattern, leave empty for none)', resourceGap: 'Minutes before the next patient can start on the same bed/room after check-out', startCpt: 'Procedure code (sets the duration)',
  searchHint: 'Search by EMR, English or Arabic name, or phone number',
};
const AR = {
  appName: 'نظام تدفق المرضى', tagline: 'الرعاية المثالية', signIn: 'تسجيل الدخول', username: 'اسم المستخدم', password: 'كلمة المرور', signOut: 'تسجيل الخروج',
  demoNote: 'نسخة تطوير — بيانات تجريبية فقط.',
  dashboard: 'لوحة التحكم', visits: 'الزيارات', queue: 'الطابور', rooms: 'الغرف', sessions: 'الجلسات', corrections: 'التصحيحات', search: 'بحث', reports: 'التقارير', settings: 'الإعدادات', system: 'النظام',
  waiting: 'في الانتظار', inTreatment: 'قيد العلاج', roomsFree: 'غرف متاحة', staffAvail: 'الكادر المتاح', callNext: 'نداء التالي', department: 'القسم', allDepartments: 'كل الأقسام',
  patient: 'المريض', mrn: 'رقم الملف', clinician: 'الأخصائي', service: 'الخدمة', room: 'الغرفة', station: 'السرير / المحطة', status: 'الحالة', actions: 'إجراءات', arrival: 'الوصول', waited: 'مدة الانتظار', priority: 'الأولوية',
  normal: 'عادي', high: 'مرتفع', urgent: 'عاجل', reason: 'السبب', cancel: 'إلغاء', save: 'حفظ', confirm: 'تأكيد', close: 'إغلاق', add: 'إضافة', edit: 'تعديل', back: 'رجوع',
  checkIn: 'تسجيل الوصول', checkOut: 'تسجيل المغادرة', newPatient: 'مريض جديد', searchPatient: 'ابحث بالاسم أو رقم الملف', name: 'الاسم', nameAr: 'الاسم (عربي)', appointment: 'الموعد', walkIn: 'بدون موعد',
  assignRoom: 'تعيين غرفة', enterRoom: 'تأكيد الدخول', transfer: 'نقل', exitRoom: 'الخروج من الغرفة', startSession: 'بدء العلاج', pause: 'إيقاف مؤقت', resume: 'استئناف', complete: 'إنهاء', timeline: 'الجدول الزمني',
  requestCorrection: 'طلب تصحيح', correctedTime: 'الوقت المصحح', originalTime: 'الوقت الأصلي', approve: 'موافقة', reject: 'رفض', pending: 'قيد المراجعة', approved: 'تمت الموافقة', rejected: 'مرفوض',
  AVAILABLE: 'متاحة', OCCUPIED: 'مشغولة', CLEANING: 'قيد التنظيف', MAINTENANCE: 'صيانة', OUT_OF_SERVICE: 'خارج الخدمة', BUSY: 'مشغول', ON_BREAK: 'استراحة', OFF_DUTY: 'خارج الدوام', UNAVAILABLE: 'غير متاح',
  WAITING: 'في الانتظار', CALLED: 'تم النداء', IN_ROOM: 'في الغرفة', DONE: 'منتهي', ACTIVE: 'نشطة', PAUSED: 'متوقفة', COMPLETED: 'مكتملة', OPEN: 'مفتوحة', CHECKED_OUT: 'غادر',
  noData: 'لا توجد بيانات بعد.', loading: 'جارٍ التحميل…', myStatus: 'حالتي', maintenance: 'صيانة', restore: 'استعادة', history: 'السجل', capacity: 'السعة', stations: 'المحطات',
  serverTime: 'وقت الخادم', synced: 'متزامن', offline: 'لا يمكن الوصول إلى الخادم. تُعرض آخر بيانات معروفة — الإجراءات متوقفة حتى عودة الاتصال. لا تُسجَّل أي أوقات أثناء انقطاع الاتصال.',
  stale: 'آخر مزامنة', session: 'جلسة', duration: 'المدة', total: 'الإجمالي', totalNoOverlap: 'الإجمالي (دون تداخل)', sumSessions: 'مجموع الجلسات',
  from: 'من', to: 'إلى', export: 'تصدير CSV', avgWait: 'متوسط الانتظار (دقيقة)', transfers: 'عمليات النقل', maintEvents: 'أحداث الصيانة', byService: 'حسب الخدمة', byRoom: 'حسب الغرفة', minutes: 'دقائق',
  health: 'صحة النظام', audit: 'سجل التدقيق', backup: 'النسخ الاحتياطي', lastBackup: 'آخر نسخة', never: 'أبدًا', database: 'قاعدة البيانات', connected: 'متصلة', failedOps: 'عمليات فاشلة (24 ساعة)', syncProblems: 'مشاكل مزامنة (24 ساعة)', recentErrors: 'أحدث الأخطاء',
  departments: 'الأقسام', services: 'الخدمات', staff: 'الموظفون', policy: 'السياسات', prefix: 'بادئة الطابور', startNo: 'رقم البداية', resetDaily: 'إعادة يومية', cleaningAfter: 'تنظيف بعد الاستخدام', active: 'نشط',
  role: 'الدور', schedule: 'الجدول', authorizedServices: 'الخدمات المصرّح بها', policyApproval: 'التصحيحات تحتاج موافقة', policyTransfer: 'سبب النقل مطلوب',
  unauthorizedNote: 'الإتاحة لا تمنح التصريح — يلزم تصريح صريح لكل خدمة.',
  from_room: 'من', to_room: 'إلى', timelineTitle: 'الجدول الزمني للزيارة', events: 'الأحداث', occupancy: 'إشغال الغرف', by: 'بواسطة',
  scheduled: 'مجدول', newAppt: 'موعد جديد', when: 'الوقت', openVisits: 'الزيارات المفتوحة', none: '—', yes: 'نعم', no: 'لا', lang: 'English',
  ev_APPOINTMENT: 'وقت الموعد', ev_ARRIVED: 'وصل المريض', ev_QUEUE_ENTERED: 'دخل الطابور', ev_QUEUE_CALLED: 'تم النداء', ev_ROOM_ASSIGNED: 'تعيين غرفة', ev_ROOM_ENTERED: 'دخل الغرفة',
  ev_TREATMENT_STARTED: 'بدأ العلاج', ev_TREATMENT_PAUSED: 'إيقاف العلاج مؤقتًا', ev_TREATMENT_RESUMED: 'استئناف العلاج', ev_TREATMENT_COMPLETED: 'انتهى العلاج',
  ev_ROOM_EXITED: 'خرج من الغرفة', ev_ROOM_TRANSFERRED: 'نقل بين الغرف', ev_CLINIC_DEPARTED: 'غادر العيادة', ev_CORRECTION_REQUESTED: 'طلب تصحيح', ev_CORRECTION_APPLIED: 'تم تطبيق التصحيح', ev_CORRECTION_REJECTED: 'رُفض التصحيح',
  mrnLabel: 'رقم السجل الطبي (EMR)', mrnAuto: 'إنشاء تلقائي', mrnManual: 'إدخال رقم سجل موجود', mrnAutoHint: 'يُمنح رقم سجل جديد عند الحفظ.',
  mrnManualHint: 'أحرف وأرقام أو “-” أو “/”، من 3 إلى 30 خانة. لا يتم استبدال رقم مستخدم مسبقًا.', fullNameEn: 'الاسم الكامل (بالإنجليزية)', fullNameAr: 'الاسم الكامل (بالعربية)',
  dob: 'تاريخ الميلاد', gender: 'الجنس', contactNumber: 'رقم التواصل', phoneHint: 'الإمارات: \u2066050 123 4567\u2069. دول أخرى: أضف رمز الدولة مثل \u2066+44 7700 900123\u2069.',
  patientDetails: 'بيانات المريض', visitDetails: 'الزيارة', registerPatient: 'تسجيل مريض', deptRequired: 'اختر القسم لتسجيل وصول المريض.', selectDeptFirst: 'اختر القسم أولًا',
  optionalWord: 'اختياري', requiredWord: 'مطلوب', savePatient: 'حفظ المريض', saveCheckIn: 'حفظ وتسجيل الوصول', saving: 'جارٍ الحفظ…', patientSaved: 'تم حفظ المريض', checkedInAs: 'تم تسجيل الوصول، رقم الدور',
  useThisPatient: 'استخدام هذا المريض', registerAnyway: 'شخص مختلف — تسجيل على أي حال', possibleDup: 'احتمال تكرار', fixErrors: 'يرجى تصحيح الحقول المحددة.',
  noResults: 'لا يوجد مريض مطابق. استخدم «مريض جديد» للتسجيل.', openVisitNote: 'زيارة مفتوحة', mrnTaken: 'رقم السجل هذا يخص', genderOptions: 'خيارات الجنس', genderCode: 'الرمز', labelEn: 'الإنجليزية', labelAr: 'العربية',
  policyNameAr: 'الاسم العربي مطلوب عند التسجيل', policyPhone: 'رقم التواصل مطلوب عند التسجيل', policyService: 'الخدمة مطلوبة عند تسجيل الوصول', patientSelected: 'المريض المحدد', changePatient: 'تغيير',
  notAuthSvc: 'ليس لديك تصريح بتقديم «{svc}».', noServicesFor: 'لا توجد خدمات مضبوطة لقسم {dept}.', noServicesAdmin: 'أضف الخدمات من الإعدادات ← الخدمات.', noServicesOther: 'اطلب من المسؤول إضافة الخدمات من الإعدادات ← الخدمات.',
  noAuthClinician: 'لا يوجد أخصائي مصرّح له بهذه الخدمة.', noAuthAdmin: 'يرجى تعيين أخصائي مصرّح له من الإعدادات ← الموظفون.', noAuthOther: 'اطلب من المسؤول تعيين أخصائي مصرّح له من الإعدادات ← الموظفون.',
  notAuthAny: 'ليس لديك تصريح بأي خدمة في قسم {dept}.', notAuthAnyHelp: 'اطلب من المسؤول منحك التصريح من الإعدادات ← الموظفون.',
  needRoom: 'عيّن غرفة للمريض أولًا.', needEntry: 'أكّد دخول المريض إلى الغرفة قبل بدء العلاج.', noDeptVisit: 'هذه الزيارة بلا قسم. سجّل وصول المريض إلى قسم أولًا.',
  startOnBehalf: 'البدء نيابةً عن', onBehalfNote: 'تُسجَّل الجلسة باسم الأخصائي المحدد، ويُسجَّل اسمك كمن بدأها.', startingAs: 'الأخصائي', openSettings: 'فتح الإعدادات',
  notAuthorizedTag: 'غير مصرّح', noClinicianTag: 'لا أخصائي مصرّح', treatmentStarted: 'بدأ العلاج', chooseService: 'اختر الخدمة', authorizedClinicians: 'الأخصائيون المصرّح لهم',
  noAuthorizedChip: 'لا أخصائي مصرّح', authHelp: 'يُمنح التصريح لكل شخص من الموظفون ← تعديل. أدوار المسؤول والمشرف بلا تصريح سريري ما لم تمنحه صراحةً.',
  authNote: 'الإتاحة للعلم فقط ولا تمنح التصريح أبدًا.', serviceDept: 'القسم',
  requiredForCheckIn: 'مطلوب لتسجيل الوصول', minShort: 'د', durationMin: 'مدة العلاج (بالدقائق)', durationHint: 'المسموح {min}–{max} دقيقة. الافتراضي {def}.', durationFixed: 'المدة ثابتة عند {def} دقيقة حسب سياسة المركز.', durationInvalid: 'أدخل عدد دقائق صحيحًا بين {min} و{max}.',
  summaryPatient: 'المريض', summaryRoom: 'الغرفة', planned: 'المخطط', remaining: 'المتبقي', scheduledEnd: 'النهاية المجدولة', actualEnd: 'النهاية الفعلية', roomEntry: 'دخول الغرفة', roomExit: 'الخروج من الغرفة', treatmentStart: 'بدء العلاج',
  waitBefore: 'الانتظار قبل الغرفة', waitInRoom: 'الانتظار داخل الغرفة', waitTotal: 'إجمالي الانتظار', totalVisit: 'إجمالي الزيارة', timing: 'التوقيت', hideTiming: 'إخفاء التوقيت', arrivalAt: 'الوصول',
  TIMER_RUNNING: 'يعمل', TIMER_PAUSED: 'المؤقت متوقف', TIMER_ELAPSED: 'انتهى الوقت', TIMER_DONE: 'مكتمل', endEarly: 'إنهاء مبكر', confirmEndEarly: 'تأكيد: إنهاء مبكر', confirmCompletion: 'تأكيد الإكمال', continuedEndNow: 'استمر العلاج — إنهاء الآن',
  elapsedNotice: 'انتهى وقت العلاج المجدول. أكّد الإكمال لتسجيل العلاج كمنتهٍ.', elapsedToast: 'انتهى الوقت المجدول', overtime: 'وقت إضافي', pauseTimer: 'إيقاف المؤقت', resumeTimer: 'استئناف المؤقت',
  completionKind_FULL: 'اكتمل في الوقت المجدول (مؤكد)', completionKind_OVERRUN: 'تجاوز الخطة (مؤكد)', completionKind_EARLY: 'انتهى مبكرًا (مؤكد)', completionKind_AUTO: 'أُغلق تلقائيًا (غير مؤكد)',
  timerAutoClose: 'إغلاق العلاج تلقائيًا عند انتهاء الوقت المجدول (يُسجَّل كغير مؤكد سريريًا؛ ولا تُفرَّغ الغرفة تلقائيًا)', allowOverride: 'يسمح للأخصائي بتغيير المدة', minMin: 'أقل مدة', maxMin: 'أقصى مدة', defaultMin: 'المدة الافتراضية',
  repWaitBefore: 'متوسط الانتظار قبل الغرفة', repWaitIn: 'متوسط الانتظار داخل الغرفة', repWaitTotal: 'متوسط إجمالي الانتظار', repPlanned: 'متوسط الدقائق المخططة', repActual: 'متوسط الدقائق المؤكدة', repOverruns: 'التجاوزات', repEarly: 'إنهاء مبكر', repFull: 'اكتمل في موعده', repAuto: 'إغلاق تلقائي (غير مؤكد)', repOcc: 'متوسط إشغال الغرفة', repVisit: 'متوسط مدة الزيارة', filters: 'عوامل التصفية', apply: 'تطبيق', patientFilter: 'اسم المريض أو رقم الملف', allRooms: 'كل الغرف', allServices: 'كل الخدمات', allClinicians: 'كل الأخصائيين', timeLeft: 'متبقي',
  ev_TIMER_ELAPSED: 'انتهى الوقت المجدول',
  treatmentboard: 'لوحة العلاج', dailyschedule: 'الجدول اليومي',
  dsToday: 'اليوم', dsPrev: 'اليوم السابق', dsNext: 'اليوم التالي', dsAllDepts: 'كل الأقسام', dsAllStaff: 'كل الموظفين', dsAllCats: 'كل الفئات', dsSearch: 'ابحث بالاسم أو رقم الملف أو الهاتف',
  dsAddAppt: 'إضافة موعد', dsAddRow: 'إضافة صف', dsAddCol: 'إضافة عمود', dsLayout: 'إدارة التخطيط', dsBlock: 'حجب وقت', dsNoSchedule: 'لم يتم إعداد جدول بعد.',
  dsSetupHelp: 'أنشئ جدولًا لكل قسم من الموظفين النشطين. يمكنك تعديل الصفوف والأوقات لاحقًا.', dsSetup: 'إعداد من الموظفين النشطين', dsAskAdmin: 'اطلب من المسؤول إعداد الجدول.',
  dsStart: 'البداية', dsEnd: 'النهاية', dsInterval: 'الفاصل (دقائق)', dsFindPatient: 'ابحث عن المريض (رقم الملف، الاسم بالعربية أو الإنجليزية، الهاتف)', dsNewPatient: 'مريض جديد', dsSelected: 'المريض المختار', dsChange: 'تغيير',
  dsDate: 'التاريخ', dsTime: 'الوقت', dsCategory: 'الفئة', dsDuration: 'المدة (دقائق)', dsSuggested: 'مقترحة من {src}', dsSrcCategory: 'الفئة', dsSrcService: 'الخدمة', dsSrcDefault: 'إعداد المركز',
  dsNotes: 'ملاحظات', dsRepeat: 'تكرار', dsNoRepeat: 'بدون تكرار', dsDaily: 'يوميًا', dsWeekly: 'أسبوعيًا', dsOccurrences: 'عدد المرات (حتى 52)', dsUntil: 'حتى تاريخ', dsSkipConflicts: 'تخطي التواريخ المتعارضة',
  dsSave: 'حفظ الموعد', dsSaved: 'تم حفظ الموعد', dsRow: 'الصف / الأخصائي', dsNoRow: '— بدون —', dsConflict: 'هذا الحجز يتعارض', dsOverride: 'تجاوز الفترة المحجوبة', dsOverrideReason: 'سبب التجاوز (مطلوب)', dsOverrideNote: 'يسمح بذلك للمسؤول أو لمشرف مفوّض فقط، ويُسجَّل في سجل التدقيق.',
  dsDetails: 'الموعد', dsEdit: 'تعديل', dsReschedule: 'إعادة جدولة', dsCopy: 'نسخ', dsCancelAppt: 'إلغاء الموعد', dsCancelReason: 'سبب الإلغاء (مطلوب)', dsConfirmCancel: 'تأكيد الإلغاء', dsArrived: 'تسجيل الوصول', dsHistory: 'السجل', dsClose: 'إغلاق',
  dsStatus_SCHEDULED: 'مجدول', dsStatus_ARRIVED: 'وصل', dsStatus_CANCELLED: 'ملغى', dsStatus_NO_SHOW: 'لم يحضر', dsUnplaced: 'مواعيد بدون صف', dsSeries: 'سلسلة متكررة',
  dsBlocked: 'محجوب', dsBlock_BREAK: 'استراحة', dsBlock_LEAVE: 'إجازة', dsBlock_MEETING: 'اجتماع', dsBlock_MAINTENANCE: 'صيانة', dsBlock_OTHER: 'أخرى', dsBlockWho: 'ينطبق على', dsWholeGroup: 'الجدول كله', dsRemoveBlock: 'إزالة الحجب', dsRemoveSeries: 'إزالة السلسلة كلها', dsBlockSaved: 'تم حفظ الفترة المحجوبة', dsBlockAffected: 'يوجد {n} موعد ضمن هذه الفترة ولم يتم تغييره.',
  dsGroup: 'مجموعة الجدول', dsStaffMember: 'الموظف (اختياري)', dsLabel: 'الاسم', dsLabelAr: 'الاسم بالعربية', dsCapacity: 'السعة (مرضى في نفس الوقت)', dsRowAdded: 'تمت إضافة الصف', dsColAdded: 'تمت إضافة الأعمدة', dsSingleTime: 'وقت واحد', dsTimeRange: 'مدى من الأوقات', dsColLabel: 'التسمية (اختياري)',
  dsHide: 'إخفاء', dsShow: 'إظهار', dsRemove: 'حذف', dsMoveUp: 'أعلى', dsMoveDown: 'أسفل', dsSyncStaff: 'إضافة الموظفين النشطين الناقصين', dsAddGroup: 'إضافة مجموعة جدول', dsRowsOf: 'الصفوف', dsColsOf: 'أعمدة الوقت', dsHidden: 'مخفي', dsLayoutHelp: 'الإخفاء يحفظ كل شيء. لا يُحذف صف أو عمود إلا إذا لم يعتمد عليه شيء، ولا تُحذف المواعيد أبدًا.', dsAdded: 'تمت إضافة {n}',
  dsWaiting: 'قائمة الانتظار', dsCancellations: 'الإلغاءات', dsFollowUp: 'مكالمات المتابعة', dsApproval: 'مكالمات الموافقة', dsRejection: 'المرفوضات', dsForDoctor: 'للطبيب', dsEvaluationList: 'التقييم',
  dsAddWaiting: 'إضافة إلى الانتظار', dsPrefClinician: 'الأخصائي المفضل', dsPrefDate: 'التاريخ المفضل', dsPrefTime: 'الوقت المفضل', dsContact: 'حالة التواصل', dsBook: 'حجز', dsRebook: 'إعادة حجز',
  dsContact_NOT_CONTACTED: 'لم يتم التواصل', dsContact_CONTACTED: 'تم التواصل', dsContact_NO_ANSWER: 'لا يرد', dsContact_WILL_CALL_BACK: 'سيتصل', dsContact_CONFIRMED: 'مؤكد',
  dsOriginal: 'الموعد الأصلي', dsReason: 'السبب', dsCancelledAt: 'وقت الإلغاء', dsBy: 'بواسطة', dsResched: 'إعادة الجدولة', dsResched_PENDING: 'لم يُعاد حجزه', dsResched_REBOOKED: 'أُعيد حجزه',
  dsAddTask: 'إضافة مهمة', dsAssignee: 'المكلّف', dsDue: 'الاستحقاق', dsTaskStatus_OPEN: 'مفتوحة', dsTaskStatus_IN_PROGRESS: 'قيد التنفيذ', dsTaskStatus_DONE: 'منجزة', dsTaskStatus_CANCELLED: 'ملغاة', dsMarkDone: 'تمت', dsTitle: 'العنوان', dsNoPatientOptional: 'المريض (اختياري)',
  dsNothing: 'لا يوجد شيء هنا.', dsLoadErr: 'تعذر تحميل الجدول.', dsOnlyAdmin: 'للمسؤولين فقط', dsCategories: 'فئات المواعيد', dsColor: 'اللون', dsDefaultMin: 'الدقائق الافتراضية', dsAllowOverride: 'يمكنه تجاوز الفترات المحجوبة (مشرف)', dsMatches: '{n} نتيجة',
  ev_OPERATIONAL_CHECKOUT: 'خروج تشغيلي (تلقائي)', ev_DOCUMENTATION_SAVED: 'تم حفظ التوثيق', ev_DOCUMENTATION_COMPLETE: 'اكتمل التوثيق', ev_DOCUMENTATION_INCOMPLETE: 'التوثيق غير مكتمل مرة أخرى',
  time: 'الوقت', treatment: 'العلاج', autoClosing: 'انتهى الوقت المجدول — يتم إيقاف العلاج وتسجيل الخروج تلقائيًا.',
  schedYellow: 'بدأ العلاج — التوثيق غير مكتمل', schedOrange: 'اكتمل التوثيق', schedYellowShort: 'التوثيق غير مكتمل', schedOrangeShort: 'اكتمل التوثيق',
  docBtn: 'التوثيق', docTitle: 'التوثيق السريري', chiefComplaint: 'الشكوى الرئيسية', diagnosisLabel: 'التشخيص', procedureCpt: 'الإجراء / رمز CPT', progressNote: 'ملاحظة المتابعة',
  docSave: 'حفظ التوثيق', docSaved: 'محفوظ وصالح', docSavedToast: 'تم حفظ التوثيق', docCount: 'اكتمل {n} من 4 حقول مطلوبة', docUnsaved: 'لديك تغييرات غير محفوظة. لا تُحتسب حتى تضغط حفظ.',
  docProb_EMPTY: 'مطلوب — غير مكتمل', docProb_TOO_SHORT: 'قصير جدًا ولا يُحتسب', docProb_FORMAT: 'لا يطابق صيغة التشخيص التي حددتها العيادة', docProb_CPT_NOT_APPROVED: 'ليس رمزًا معتمدًا حاليًا',
  docNoCpt: 'لا توجد رموز إجراءات معتمدة بعد. يضيفها المسؤول من الإعدادات ← رموز الإجراءات.', docReadOnly: 'يحرر التوثيق الأخصائي المعالج فقط. يمكنك رؤية الحقول المكتملة دون النص السريري.',
  opCheckout: 'الخروج التشغيلي', opCheckoutAuto: 'تلقائي عند نهاية الوقت المجدول — ليس إكمالًا سريريًا ولا مغادرة', opCheckoutManual: 'سُجل عند إنهاء العلاج', opCheckoutAutoShort: 'تلقائي',
  scheduleDay: 'اليوم', scheduleHelp: 'يبقى اللون الأصفر حتى تُحفظ حقول التوثيق الأربعة وتكون صالحة؛ يظهر البرتقالي تلقائيًا ويعود إلى الأصفر إذا أصبح التوثيق ناقصًا. الخروج التلقائي لا يكمل التوثيق.',
  cptCodes: 'رموز الإجراءات', cptCode: 'الرمز', cptDesc: 'الوصف', cptMinutes: 'الدقائق الافتراضية', cptHelp: 'تُقبل الرموز النشطة المدرجة هنا فقط. يدخل المركز رموزه المعتمدة؛ لا يوفر التطبيق أي رموز.',
  docMinChars: 'الحد الأدنى للأحرف في حقل التوثيق النصي', diagnosisPattern: 'صيغة التشخيص (نمط اختياري، اتركه فارغًا لعدم التقييد)', resourceGap: 'دقائق قبل أن يبدأ المريض التالي على نفس السرير/الغرفة بعد الخروج', startCpt: 'رمز الإجراء (يحدد المدة)',
  searchHint: 'ابحث برقم السجل أو الاسم بالعربية أو الإنجليزية أو رقم الهاتف',
};
const DICT = { en: EN, ar: AR };
const Ctx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('fmc_lang') || 'en'; } catch { return 'en'; } });
  useEffect(() => {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('fmc_lang', lang); } catch { /* ignore */ }
  }, [lang]);
  const t = (k) => DICT[lang][k] ?? EN[k] ?? k;
  const loc = (o, f = 'name') => (lang === 'ar' && o?.[`${f}_ar`]) || o?.[f] || '';
  const tz = 'Asia/Dubai';
  const fmt = (iso, o = { hour: '2-digit', minute: '2-digit', second: '2-digit' }) => (iso ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', { timeZone: window.__tz || tz, ...o }).format(new Date(iso)) : '—');
  const fmtDT = (iso) => fmt(iso, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return <Ctx.Provider value={{ lang, setLang, t, loc, fmt, fmtDT }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);

/** Countdown/stopwatch as minutes:seconds (60 minutes shows 60:00, never rolls into hours). */
export const fmtCountdown = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
/** Waiting time in minutes and hours, e.g. "12 min 05 s" or "1 h 05 min". */
export const fmtWait = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(s % 60).padStart(2, '0')} s`; };
/** Waiting values from stored timestamps; ticks live until the next milestone is reached. */
export function waitingView(tm, now) {
  const at = (x) => (x ? Date.parse(x) : null); const arrival = at(tm.arrival_at); const entry = at(tm.room_entry_at); const start = at(tm.treatment_start_at); const stop = at(tm.departed_at) ?? now;
  return { before: entry ? entry - arrival : Math.max(0, stop - arrival), inRoom: entry ? (start ? start - entry : Math.max(0, stop - entry)) : null, total: start ? start - arrival : Math.max(0, stop - arrival), live: !start && !tm.departed_at };
}
/** Countdown state from stored fields; `now` is the server-aligned clock. Never negative. */
export function timerView(s, now) {
  if (!s.planned_minutes) return { legacy: true, state: s.status === 'PAUSED' ? 'PAUSED' : 'RUNNING' };
  if (s.status === 'COMPLETED') return { state: 'DONE', remaining: 0, overtime: 0 };
  if (s.status === 'PAUSED') return { state: 'PAUSED', remaining: s.remaining_ms ?? 0, overtime: 0 };
  const end = Date.parse(s.scheduled_end_at); const left = end - now;
  return left <= 0 || s.timer_state === 'ELAPSED' ? { state: 'ELAPSED', remaining: 0, overtime: Math.max(0, now - end) } : { state: 'RUNNING', remaining: left, overtime: 0 };
}
export const fmtMs = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}`; };
