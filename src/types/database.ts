import type { ProfileRole, StudentStatus } from "@/types/rbac";

export type Timestamp = string;
export type DateString = string;
export type AcademicTermStatus = "draft" | "active" | "closed" | "archived";
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type DepartmentRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  school_name: string | null;
  expertise_area: string | null;
  hometown: string | null;
  birth_date: DateString | null;
  address: string | null;
  biography: string | null;
  role: ProfileRole;
  department_id: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ClassRow = {
  id: string;
  department_id: string;
  name: string;
  slug: string;
  class_teacher_id: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type StudentRow = {
  id: string;
  full_name: string;
  identity_number: string | null;
  father_name: string | null;
  mother_name: string | null;
  guardian_phone: string | null;
  guardian_phone_2: string | null;
  father_job: string | null;
  mother_job: string | null;
  father_status: string | null;
  mother_status: string | null;
  family_monthly_income: string | null;
  home_status: string | null;
  parent_marital_status: string | null;
  blood_type: string | null;
  sibling_in_institution: string | null;
  birth_date: DateString | null;
  registration_date: DateString | null;
  course_class_id: string | null;
  school_class: string | null;
  school_name: string | null;
  nationality: string | null;
  hometown: string | null;
  address: string | null;
  photo_url: string | null;
  status: StudentStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type CourseRow = {
  id: string;
  department_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ClassCourseRow = {
  id: string;
  class_id: string;
  course_id: string;
  teacher_id: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type WeeklyScheduleSlotRow = {
  id: string;
  class_id: string;
  class_course_id: string;
  day_of_week: number;
  period_no: number;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  note: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ExamTypeRow = {
  id: string;
  course_id: string;
  name: string;
  slug: string;
  weight: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AcademicTermRow = {
  id: string;
  name: string;
  start_date: DateString | null;
  end_date: DateString | null;
  status: AcademicTermStatus;
  closed_at: Timestamp | null;
  closed_by: string | null;
  is_current: boolean;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type GradeRow = {
  id: string;
  student_id: string;
  course_id: string;
  exam_type_id: string;
  term_id: string | null;
  grade: number;
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type StudentEvaluationRow = {
  id: string;
  student_id: string;
  term_id: string;
  behavior_score: number | null;
  attendance_score: number | null;
  lesson_performance_score: number | null;
  discipline_score: number | null;
  memorization_score: number | null;
  general_opinion: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type InfirmaryRecordRow = {
  id: string;
  student_id: string;
  record_date: DateString;
  complaint: string | null;
  treatment: string | null;
  sent_to_hospital: boolean;
  hospital_name: string | null;
  medication_given: string | null;
  parent_informed: boolean;
  note: string | null;
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  target_role: ProfileRole | null;
  department_id: string | null;
  created_by: string | null;
  is_published: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type StudentDocumentRow = {
  id: string;
  student_id: string;
  document_type: string;
  file_url: string;
  uploaded_by: string | null;
  created_at: Timestamp;
};

export type ParentStudentLinkRow = {
  id: string;
  parent_profile_id: string;
  student_id: string;
  relation: string | null;
  created_at: Timestamp;
};

export type DormitoryRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type DormitoryFloorRow = {
  id: string;
  dormitory_id: string;
  name: string;
  floor_no: number | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type DormitoryRoomRow = {
  id: string;
  floor_id: string;
  name: string;
  room_no: string | null;
  capacity: number;
  is_active: boolean;
  note: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type DormitoryBedRow = {
  id: string;
  room_id: string;
  bed_no: string;
  is_active: boolean;
  note: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type DormitoryAssignmentStatus = "active" | "ended";

export type DormitoryAssignmentRow = {
  id: string;
  student_id: string;
  bed_id: string;
  start_date: DateString;
  end_date: DateString | null;
  status: DormitoryAssignmentStatus;
  note: string | null;
  assigned_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type StudentProfileNoteRow = {
  id: string;
  student_id: string;
  term_id: string | null;
  note: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type StudentBookRow = {
  id: string;
  student_id: string;
  term_id: string | null;
  title: string;
  author: string | null;
  read_date: DateString | null;
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type StudentTermSnapshotRow = {
  id: string;
  student_id: string;
  term_id: string;
  department_id: string | null;
  class_id: string | null;
  student_status: string | null;
  grade_average: number | null;
  evaluation_summary: JsonValue | null;
  total_grades: number;
  total_evaluations: number;
  total_infirmary_records: number;
  snapshot_data: JsonValue | null;
  created_at: Timestamp;
  created_by: string | null;
};

export type AttendanceType = "daily" | "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type AttendanceRecordStatus = "present" | "absent" | "excused" | "late";

export type AttendanceSessionRow = {
  id: string;
  class_id: string;
  attendance_date: DateString;
  attendance_type: AttendanceType;
  taken_by: string | null;
  note: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AttendanceRecordRow = {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceRecordStatus;
  note: string | null;
  recorded_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AuditLogRow = {
  id: string;
  actor_profile_id: string | null;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  student_id: string | null;
  title: string;
  description: string | null;
  before_data: JsonValue | null;
  after_data: JsonValue | null;
  metadata: JsonValue | null;
  created_at: Timestamp;
};

export type Database = {
  public: {
    Tables: {
      departments: TableDefinition<DepartmentRow>;
      profiles: TableDefinition<ProfileRow>;
      classes: TableDefinition<ClassRow>;
      students: TableDefinition<StudentRow>;
      courses: TableDefinition<CourseRow>;
      class_courses: TableDefinition<ClassCourseRow>;
      weekly_schedule_slots: TableDefinition<WeeklyScheduleSlotRow>;
      exam_types: TableDefinition<ExamTypeRow>;
      academic_terms: TableDefinition<AcademicTermRow>;
      grades: TableDefinition<GradeRow>;
      student_evaluations: TableDefinition<StudentEvaluationRow>;
      infirmary_records: TableDefinition<InfirmaryRecordRow>;
      announcements: TableDefinition<AnnouncementRow>;
      student_documents: TableDefinition<StudentDocumentRow>;
      parent_student_links: TableDefinition<ParentStudentLinkRow>;
      dormitories: TableDefinition<DormitoryRow>;
      dormitory_floors: TableDefinition<DormitoryFloorRow>;
      dormitory_rooms: TableDefinition<DormitoryRoomRow>;
      dormitory_beds: TableDefinition<DormitoryBedRow>;
      dormitory_assignments: TableDefinition<DormitoryAssignmentRow>;
      student_profile_notes: TableDefinition<StudentProfileNoteRow>;
      student_books: TableDefinition<StudentBookRow>;
      student_term_snapshots: TableDefinition<StudentTermSnapshotRow>;
      audit_logs: TableDefinition<AuditLogRow>;
      attendance_sessions: TableDefinition<AttendanceSessionRow>;
      attendance_records: TableDefinition<AttendanceRecordRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
