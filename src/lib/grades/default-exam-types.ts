import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DEFAULT_EXAM_TYPES = [
  { name: "1. Yazılı", slug: "1-yazili", weight: 1 },
  { name: "2. Yazılı", slug: "2-yazili", weight: 1 },
  { name: "3. Yazılı", slug: "3-yazili", weight: 1 },
  { name: "4. Yazılı", slug: "4-yazili", weight: 1 },
  { name: "Kanaat Notu", slug: "kanaat-notu", weight: 1 },
] as const;

export async function ensureDefaultExamTypesForCourses(courseIds: string[]) {
  const uniqueCourseIds = Array.from(new Set(courseIds.filter(Boolean)));

  if (uniqueCourseIds.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("exam_types").upsert(
    uniqueCourseIds.flatMap((courseId) =>
      DEFAULT_EXAM_TYPES.map((examType) => ({
        course_id: courseId,
        name: examType.name,
        slug: examType.slug,
        weight: examType.weight,
        is_active: true,
      })),
    ),
    { onConflict: "course_id,slug" },
  );
}
