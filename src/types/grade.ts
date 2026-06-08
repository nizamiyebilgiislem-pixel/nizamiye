import type { Department } from "@/types/rbac";

export type Course = {
  id: string;
  department_id: string;
  name: string;
  slug: Department | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExamType = {
  id: string;
  course_id: string;
  name: string;
  slug: string;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GradeEntry = {
  id: string;
  student_id: string;
  course_id: string;
  exam_type_id: string;
  term_id: string | null;
  grade: number;
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
