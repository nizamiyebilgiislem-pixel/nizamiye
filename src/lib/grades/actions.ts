"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { canEditClassCourseGrades, canEditStudentGrades } from "@/lib/grades/permissions";
import { getClassCoursesForStudent } from "@/lib/grades/queries";
import { getStudentById } from "@/lib/students/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAcademicTermWritable } from "@/lib/terms/guards";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const gradeSchema = z.coerce.number().min(0, "Not 0'dan küçük olamaz.").max(100, "Not 100'den büyük olamaz.");

function buildGradeEntryRedirectUrl(params: {
  departmentId?: string;
  classId?: string;
  classCourseId?: string;
  examTypeId?: string;
  error?: string;
  success?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.departmentId) searchParams.set("department", params.departmentId);
  if (params.classId) searchParams.set("class", params.classId);
  if (params.classCourseId) searchParams.set("course", params.classCourseId);
  if (params.examTypeId) searchParams.set("exam", params.examTypeId);
  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);

  const query = searchParams.toString();
  return query.length > 0 ? `/not-sistemi/not-girisi?${query}` : "/not-sistemi/not-girisi";
}

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

  try {
    await requireAcademicTermWritable(termId);
  } catch {
    redirect(`/not-sistemi/not-girisi/${student.id}?error=term-closed`);
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
  redirect(`/not-sistemi/not-girisi/${student.id}?success=saved&term=${termId}`);
}

export async function saveClassCourseGradesAction(formData: FormData) {
  const { profile } = await requireAuth();
  const departmentId = String(formData.get("department_id") ?? "");
  const classId = String(formData.get("class_id") ?? "");
  const classCourseId = String(formData.get("class_course_id") ?? "");
  const examTypeId = String(formData.get("exam_type_id") ?? "");
  const termId = String(formData.get("term_id") ?? "");
  const redirectBase = {
    departmentId,
    classId,
    classCourseId,
    examTypeId,
  };

  if (!departmentId || !classId || !classCourseId || !examTypeId || !termId) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "selection" }));
  }

  try {
    await requireAcademicTermWritable(termId);
  } catch {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "term-closed" }));
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: classRow, error: classError }, { data: classCourse, error: classCourseError }, { data: examType, error: examTypeError }] = await Promise.all([
    supabase.from("classes").select("id,name,department_id,class_teacher_id").eq("id", classId).maybeSingle(),
    supabase.from("class_courses").select("id,class_id,course_id,teacher_id,is_active").eq("id", classCourseId).maybeSingle(),
    supabase.from("exam_types").select("id,course_id,name").eq("id", examTypeId).maybeSingle(),
  ]);

  if (classError || classCourseError || examTypeError || !classRow || !classCourse || !examType) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "selection" }));
  }

  if (classCourse.class_id !== classRow.id || classCourse.course_id !== examType.course_id) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "selection" }));
  }

  if (!canEditClassCourseGrades(profile, classRow, classCourse)) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "unauthorized" }));
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id,full_name,status")
    .eq("course_class_id", classRow.id)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (studentsError) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "save" }));
  }

  const studentRows = students ?? [];
  if (studentRows.length === 0) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "no-students" }));
  }

  const rows = [];

  for (const student of studentRows) {
    if (!canEditStudentGrades(profile, student, classRow, [classCourse])) {
      redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "unauthorized" }));
    }

    const rawGrade = String(formData.get(`grade:${student.id}`) ?? "").trim();
    const note = String(formData.get(`note:${student.id}`) ?? "").trim();

    if (rawGrade.length === 0) {
      continue;
    }

    const parsedGrade = gradeSchema.safeParse(rawGrade);
    if (!parsedGrade.success) {
      redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "grade" }));
    }

    rows.push({
      student_id: student.id,
      course_id: classCourse.course_id,
      exam_type_id: examType.id,
      term_id: termId,
      grade: parsedGrade.data,
      note: note.length > 0 ? note : null,
      created_by: profile.id,
      updated_by: profile.id,
    });
  }

  if (rows.length === 0) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "empty" }));
  }

  const { error } = await supabase.from("grades").upsert(rows, {
    onConflict: "student_id,course_id,exam_type_id,term_id",
  });

  if (error) {
    redirect(buildGradeEntryRedirectUrl({ ...redirectBase, error: "save" }));
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "grade_saved",
    title: "Toplu not girildi/güncellendi",
    description: `${classRow.name} sınıfında ${rows.length} not kaydı işlendi.`,
    entityType: "grade",
    entityId: classCourse.id,
    studentId: null,
    beforeData: null,
    afterData: {
      class_id: classRow.id,
      class_course_id: classCourse.id,
      exam_type_id: examType.id,
      term_id: termId,
      rows,
    },
    metadata: {
      row_count: rows.length,
      class_id: classRow.id,
      class_course_id: classCourse.id,
      exam_type_id: examType.id,
    },
  });

  revalidatePath("/not-sistemi/not-girisi");
  revalidatePath("/dashboard");
  revalidatePath("/bolumler");
  revalidatePath(`/siniflar/${classRow.id}`);
  redirect(buildGradeEntryRedirectUrl({ ...redirectBase, success: "saved" }));
}

export async function deleteGradeAction(gradeId: string) {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("grades")
    .delete()
    .eq("id", gradeId);

  if (error) {
    logSupabaseActionError({ action: "deleteGrade", profile, payload: { id: gradeId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "grade_deleted",
    entityType: "grade",
    entityId: gradeId,
    title: "Not silindi",
  });

  revalidatePath("/not-sistemi");
  revalidatePath("/dashboard");
  return { success: true };
}
