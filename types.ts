
export interface Student {
  id: string;
  name: string;
  grade: string;
  classes: string[];
  attendance: AttendanceRecord[];
  behaviors: BehaviorRecord[];
  grades: GradeRecord[];
  parentPhone?: string;
  avatar?: string;
  spentCoins?: number; 
  groupId?: string | null; // معرف الفريق (ديناميكي)
  // حقول إضافية للربط مع الوزارة
  ministryId?: string; // StudentSchoolNo
}

export interface Group {
  id: string;
  name: string;
  color: string; // Tailwind color
}

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'truant';

export interface BehaviorRecord {
  id: string;
  date: string;
  type: BehaviorType;
  description: string;
  points: number;
  semester?: '1' | '2';
}

export type BehaviorType = 'positive' | 'negative';

export interface GradeRecord {
  id: string;
  subject: string;
  category: string; // "short_test_1", "project", etc.
  score: number;
  maxScore: number;
  date: string;
  semester?: '1' | '2';
}

export interface ScheduleDay {
  dayName: string;
  periods: string[]; // Array of class names or subjects for 8 periods
}

export interface PeriodTime {
  periodNumber: number;
  startTime: string; // "07:30"
  endTime: string;   // "08:10"
}

export interface AssessmentTool {
  id: string;
  name: string;
  maxScore: number;
}

// بيانات جلسة الوزارة
export interface MinistrySession {
    userId: string;
    auth: string; // Token
    userRoleId: string;
    schoolId: string;
    teacherId?: string; // DepInsId
}

// تفاصيل الغياب لكل طالب للإرسال للسيرفر
export interface StdsAbsDetail {
    StudentId: string; // أو StudentSchoolNo
    AbsenceType: number; // عادة 1=غياب، 2=تأخر، 0=حضور
    ReasonId?: number; // اختياري
    Notes?: string;
}

// تفاصيل الدرجات لكل طالب للإرسال للسيرفر
export interface StdsGradeDetail {
    StudentId: string;
    MarkValue: string; // الدرجة كنص
    IsAbsent?: boolean; // هل غائب عن الامتحان
    Notes?: string;
}

// --- تعريف الجسر الإلكتروني (Electron Bridge) ---
// هذا يسمح لـ TypeScript بمعرفة أن window.electron موجود وآمن للاستخدام
declare global {
  interface Window {
    electron?: {
      openExternal: (url: string) => Promise<void>;
    };
  }
}
