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

export type DormitoryRow = {
  id: string;
  department_id: string;
  name: string;
  capacity: number;
  description: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type DormitoryAssignmentStatus = "active" | "ended";

export type DormitoryAssignmentRow = {
  id: string;
  dormitory_id: string;
  student_id: string;
  start_date: DateString;
  end_date: DateString | null;
  status: DormitoryAssignmentStatus;
  note: string | null;
  assigned_by: string | null;
  created_at: Timestamp;
};

export type LibraryCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type LibraryBookRow = {
  id: string;
  category_id: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  publication_year: number | null;
  shelf_code: string | null;
  location_note: string | null;
  total_count: number;
  available_count: number;
  description: string | null;
  cover_url: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type LibraryLoanStatus = "borrowed" | "returned" | "lost";
export type LibraryBorrowerType = "student" | "profile";

export type LibraryLoanRow = {
  id: string;
  book_id: string;
  borrower_type: LibraryBorrowerType;
  student_id: string | null;
  profile_id: string | null;
  loan_date: DateString;
  due_date: DateString | null;
  returned_at: DateString | null;
  status: LibraryLoanStatus;
  note: string | null;
  given_by: string | null;
  received_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type LibraryDocumentType = "pdf" | "word" | "excel" | "image" | "other";

export type LibraryDocumentRow = {
  id: string;
  title: string;
  category_id: string | null;
  document_type: LibraryDocumentType | null;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  description: string | null;
  uploaded_by: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type GuidanceInterviewRow = {
  id: string;
  student_id: string;
  counselor_id: string | null;
  interview_date: string;
  interview_type: "individual" | "group" | "parent" | "emergency" | "follow_up";
  visibility: "private" | "summary" | "shared";
  title: string;
  summary: string | null;
  private_notes: string | null;
  emotional_state: string | null;
  academic_state: string | null;
  social_state: string | null;
  action_plan: string | null;
  next_follow_up_date: string | null;
  status: "open" | "followed" | "closed";
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type GuidanceFollowUpRow = {
  id: string;
  interview_id: string | null;
  student_id: string;
  assigned_to: string | null;
  follow_up_date: string;
  title: string;
  description: string | null;
  result_note: string | null;
  status: "planned" | "completed" | "cancelled";
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type GuidanceSurveyRow = {
  id: string;
  title: string;
  description: string | null;
  target_scope: "all_students" | "department" | "class";
  department_id: string | null;
  class_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_anonymous: boolean;
  status: "draft" | "active" | "closed";
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type GuidanceSurveyQuestionRow = {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: "scale" | "choice" | "text" | "yes_no";
  options: JsonValue | null;
  sort_order: number;
  is_required: boolean;
  created_at: Timestamp;
};

export type GuidanceSurveyResponseRow = {
  id: string;
  survey_id: string;
  student_id: string | null;
  profile_id: string | null;
  submitted_at: Timestamp;
  created_at: Timestamp;
};

export type GuidanceSurveyAnswerRow = {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_number: number | null;
  answer_json: JsonValue | null;
  created_at: Timestamp;
};

export type GuidanceActivityRow = {
  id: string;
  title: string;
  activity_type: "trip" | "seminar" | "meeting" | "sports" | "cultural" | "activity";
  description: string | null;
  location: string | null;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  status: "planned" | "completed" | "cancelled";
  department_id: string | null;
  responsible_profile_id: string | null;
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type GuidanceActivityParticipantRow = {
  id: string;
  activity_id: string;
  student_id: string | null;
  profile_id: string | null;
  participant_type: "student" | "profile";
  attendance_status: "planned" | "attended" | "absent";
  created_at: Timestamp;
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

export type TalepRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  requested_unit: string;
  requested_by: string;
  assigned_to: string | null;
  target_person: string | null;
  status: string;
  deadline: DateString | null;
  response_note: string | null;
  rejection_reason: string | null;
  internal_note: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_by: string;
  assigned_to: string;
  department_id: string | null;
  due_date: DateString | null;
  completed_at: Timestamp | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type TaskCommentRow = {
  id: string;
  task_id: string;
  profile_id: string;
  comment: string;
  created_at: Timestamp;
};

export type TaskAttachmentRow = {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  created_at: Timestamp;
};

export type Database = {
  public: {
    Tables: {
      talepler: TableDefinition<TalepRow>;
      tasks: TableDefinition<TaskRow>;
      task_comments: TableDefinition<TaskCommentRow>;
      task_attachments: TableDefinition<TaskAttachmentRow>;
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
      student_profile_notes: TableDefinition<StudentProfileNoteRow>;
      student_books: TableDefinition<StudentBookRow>;
      student_term_snapshots: TableDefinition<StudentTermSnapshotRow>;
      audit_logs: TableDefinition<AuditLogRow>;
      attendance_sessions: TableDefinition<AttendanceSessionRow>;
      attendance_records: TableDefinition<AttendanceRecordRow>;
      dormitories: TableDefinition<DormitoryRow>;
      dormitory_assignments: TableDefinition<DormitoryAssignmentRow>;
      library_categories: TableDefinition<LibraryCategoryRow>;
      library_books: TableDefinition<LibraryBookRow>;
      library_loans: TableDefinition<LibraryLoanRow>;
      library_documents: TableDefinition<LibraryDocumentRow>;
      guidance_interviews: TableDefinition<GuidanceInterviewRow>;
      guidance_follow_ups: TableDefinition<GuidanceFollowUpRow>;
      guidance_surveys: TableDefinition<GuidanceSurveyRow>;
      guidance_survey_questions: TableDefinition<GuidanceSurveyQuestionRow>;
      guidance_survey_responses: TableDefinition<GuidanceSurveyResponseRow>;
      guidance_survey_answers: TableDefinition<GuidanceSurveyAnswerRow>;
      guidance_activities: TableDefinition<GuidanceActivityRow>;
      guidance_activity_participants: TableDefinition<GuidanceActivityParticipantRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
