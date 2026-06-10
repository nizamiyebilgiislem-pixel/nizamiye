import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { ClassTeacherDashboard } from "@/components/dashboard/class-teacher-dashboard";
import { CourseTeacherDashboard } from "@/components/dashboard/course-teacher-dashboard";
import { DefaultDashboard } from "@/components/dashboard/default-dashboard";
import { DepartmentManagerDashboard } from "@/components/dashboard/department-manager-dashboard";
import { requireAuth } from "@/lib/auth";
import { getPrimaryDashboardRole } from "@/lib/dashboard/permissions";

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const role = await getPrimaryDashboardRole(profile);

  switch (role) {
    case "admin":
    case "genel_mudur":
      return <AdminDashboard profile={profile} />;
    case "bolum_muduru":
      return <DepartmentManagerDashboard profile={profile} />;
    case "class_teacher":
      return <ClassTeacherDashboard profile={profile} />;
    case "course_teacher":
      return <CourseTeacherDashboard profile={profile} />;
    default:
      return <DefaultDashboard profile={profile} />;
  }
}
