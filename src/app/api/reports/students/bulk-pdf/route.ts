import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { logPdfGenerated } from "@/lib/reports/actions";
import {
  createStudentBulkReportPdf,
  getStudentBulkReportFileName,
  getStudentBulkReportScope,
} from "@/lib/reports/student-bulk-pdf";

export async function GET(request: Request) {
  const { profile } = await requireAuth();
  const url = new URL(request.url);
  const departmentId = url.searchParams.get("departmentId");
  const classId = url.searchParams.get("classId");
  const scope = await getStudentBulkReportScope(profile, { departmentId, classId });

  if (scope.students.length === 0) {
    return NextResponse.json({ error: "Bu kapsamda aktif talebe bulunamadi." }, { status: 404 });
  }

  const pdf = createStudentBulkReportPdf(scope);
  const fileName = getStudentBulkReportFileName(scope);

  await logPdfGenerated(profile, {
    reportType: "student_bulk_information_form",
    entityType: "student_report",
    entityId: classId ?? departmentId ?? profile.id,
    title: `${scope.scopeLabel} Talebe Toplu PDF`,
    description: `${scope.students.length} talebe icin toplu PDF olusturuldu.`,
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
