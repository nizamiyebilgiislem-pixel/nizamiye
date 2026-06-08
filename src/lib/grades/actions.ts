"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { canEditStudentGrades } from "@/lib/grades/permissions";
import { getClassCoursesForStudent } from "@/lib/grades/queries";
import { getStudentById } from "@/lib/students/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const gradeSchema = z.coerce.number().min(0, "Not 0'dan küçük olamaz.").max(100, "Not 100'den büyük olamaz.");

export async function saveStudentGradesAction(formData: FormData) {
  const { profile } = await requireAuth();
  const studentId = String(formData.get("student_id") ?? "");
  const termValue = String(formData.get("term_id") ?? "");
  const termId = termValue.length > 0 ? termValue : null;
  const student = await getStudentById(studentId);

  if (!student) {
    redirect("/not-sistemi/not-girisi?error=not-found");
  }

  if (!student.course_class) {
    redirect(`/not-sistemi/not-girisi/${student.id}?error=class`);
  }

  const classCourses = await getClassCoursesForStudent(student.course_class.id);
  if (!canEditStudentGrades(profile, student, student.course_class, classCourses)) {
    redirect(`/not-sistemi/not-girisi/${student.id}?error=unauthorized`);
  }

  const rows = [];

  for (const classCourse of classCourses) {
    const course = classCourse.course;
    if (!course) {
      continue;
    }

    for (const examType of classCourse.exam_types) {
      const key = `grade:${course.id}:${examType.id}`;
      const rawGrade = String(formData.get(key) ?? "").trim();
      const note = String(formData.get(`note:${course.id}:${examType.id}`) ?? "").trim();

      if (rawGrade.length === 0) {
        continue;
      }

      if (!canEditStudentGrades(profile, student, student.course_class, [classCourse])) {
        redirect(`/not-sistemi/not-girisi/${student.id}?error=unauthorized`);
      }

      const parsedGrade = gradeSchema.safeParse(rawGrade);
      if (!parsedGrade.success) {
        redirect(`/not-sistemi/not-girisi/${student.id}?error=grade`);
      }

      rows.push({
        student_id: student.id,
        course_id: course.id,
        exam_type_id: examType.id,
        term_id: termId,
        grade: parsedGrade.data,
        note: note.length > 0 ? note : null,
        created_by: profile.id,
        updated_by: profile.id,
      });
    }
  }

  if (rows.length === 0) {
    redirect(`/not-sistemi/not-girisi/${student.id}?error=empty`);
  }

  if (!termId) {
    redirect(`/not-sistemi/not-girisi/${student.id}?error=term`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("grades").upsert(rows, {
    onConflict: "student_id,course_id,exam_type_id,term_id",
  });

  if (error) {
    redirect(`/not-sistemi/not-girisi/${student.id}?error=save`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "grade_saved",
    title: "Not girildi/güncellendi",
    description: `${student.full_name} için ${rows.length} not kaydı işlendi.`,
    entityType: "grade",
    entityId: student.id,
    studentId: student.id,
    beforeData: null,
    afterData: {
      term_id: termId,
      rows,
    },
    metadata: {
      row_count: rows.length,
      class_id: student.course_class.id,
    },
  });

  revalidatePath(`/talebeler/${student.id}`);
  revalidatePath(`/not-sistemi/not-girisi/${student.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/bolumler");
  revalidatePath(`/siniflar/${student.course_class.id}`);
  redirect(`/not-sistemi/not-girisi/${student.id}?saved=1&term=${termId}`);
}
