import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canManageLoans } from "@/lib/library/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoanForm } from "@/components/library/loan-form";
import { createLoanAction } from "@/lib/library/actions";

type Props = {
  searchParams: Promise<{ book_id?: string }>;
};

export default async function YeniEmanetPage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const params = await searchParams;

  if (!await canManageLoans(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const supabase = await createSupabaseServerClient();

  const [booksResult, studentsResult, profilesResult] = await Promise.all([
    supabase
      .from("library_books")
      .select("id, title, author, available_count, shelf_code")
      .eq("is_active", true)
      .gt("available_count", 0)
      .order("title", { ascending: true }),
    supabase
      .from("students")
      .select("id, full_name")
      .eq("status", "active")
      .order("full_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["hoca", "kutuphane_gorevlisi"])
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kütüphane" title="Yeni Emanet" description="Bir kitabı talebe veya personele emanet verin." />
      <LoanForm
        action={createLoanAction}
        preselectedBookId={params.book_id}
        books={booksResult.data ?? []}
        students={studentsResult.data ?? []}
        profiles={profilesResult.data ?? []}
      />
    </div>
  );
}
