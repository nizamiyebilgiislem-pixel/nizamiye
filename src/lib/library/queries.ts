import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LibraryBookRow, LibraryCategoryRow, LibraryDocumentRow, LibraryLoanRow, ProfileRow } from "@/types/database";

export type BookWithCategory = LibraryBookRow & {
  category: Pick<LibraryCategoryRow, "id" | "name"> | null;
};

export type LoanWithRelations = LibraryLoanRow & {
  book: Pick<LibraryBookRow, "id" | "title" | "author"> | null;
  student: { id: string; full_name: string } | null;
  profile: { id: string; full_name: string } | null;
  given_by_profile: { id: string; full_name: string } | null;
  received_by_profile: { id: string; full_name: string } | null;
};

export type LoanWithBook = LibraryLoanRow & {
  book: Pick<LibraryBookRow, "id" | "title" | "author"> | null;
  student: { id: string; full_name: string } | null;
  profile: { id: string; full_name: string } | null;
};

export type DocumentWithRelations = LibraryDocumentRow & {
  category: Pick<LibraryCategoryRow, "id" | "name"> | null;
  uploader: { id: string; full_name: string } | null;
};

export async function getCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Kategoriler alınamadı.");
  }

  return data as unknown as LibraryCategoryRow[];
}

export async function getActiveCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Kategoriler alınamadı.");
  }

  return data as unknown as LibraryCategoryRow[];
}

export async function getCategoryById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as LibraryCategoryRow;
}

export async function getBooks(profile: ProfileRow, filters?: { search?: string; category_id?: string; is_active?: boolean; available?: boolean }, page?: number, pageSize = 20) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("library_books")
    .select("*, category:category_id(id, name)", { count: "exact" })
    .order("title", { ascending: true });

  if (filters?.search) {
    const search = `%${filters.search}%`;
    query = query.or(`title.ilike.${search},author.ilike.${search},isbn.ilike.${search}`);
  }

  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  if (filters?.available === true) {
    query = query.gt("available_count", 0);
  }

  if (page !== undefined) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Kitaplar alınamadı.");
  }

  return { books: data as unknown as BookWithCategory[], totalCount: count ?? 0 };
}

export async function getBookById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_books")
    .select("*, category:category_id(id, name)")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as BookWithCategory;
}

export async function getLoans(profile: ProfileRow, filters?: { status?: string; overdue?: boolean; student_id?: string; profile_id?: string; book_id?: string }, page?: number, pageSize = 20) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("library_loans")
    .select("*, book:book_id(id, title, author), student:student_id(id, full_name), profile:profile_id(id, full_name), given_by_profile:given_by(id, full_name), received_by_profile:received_by(id, full_name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status as "borrowed" | "returned" | "lost");
  }

  if (filters?.overdue) {
    query = query.lt("due_date", new Date().toISOString().split("T")[0]);
    query = query.eq("status", "borrowed");
  }

  if (filters?.student_id) {
    query = query.eq("student_id", filters.student_id);
  }

  if (filters?.profile_id) {
    query = query.eq("profile_id", filters.profile_id);
  }

  if (filters?.book_id) {
    query = query.eq("book_id", filters.book_id);
  }

  if (page !== undefined) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Emanetler alınamadı.");
  }

  return { loans: data as unknown as LoanWithRelations[], totalCount: count ?? 0 };
}

export async function getLoanById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_loans")
    .select("*, book:book_id(id, title, author, available_count, total_count), student:student_id(id, full_name), profile:profile_id(id, full_name), given_by_profile:given_by(id, full_name), received_by_profile:received_by(id, full_name)")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as LoanWithRelations;
}

export async function getStudentLoans(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_loans")
    .select("*, book:book_id(id, title, author)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Öğrenci emanetleri alınamadı.");
  }

  return data as unknown as LoanWithBook[];
}

export async function getProfileLoans(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_loans")
    .select("*, book:book_id(id, title, author)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Kullanıcı emanetleri alınamadı.");
  }

  return data as unknown as LoanWithBook[];
}

export async function getDocuments(profile: ProfileRow, filters?: { category_id?: string; document_type?: string }) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("library_documents")
    .select("*, category:category_id(id, name), uploader:uploaded_by(id, full_name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id);
  }

  if (filters?.document_type) {
    query = query.eq("document_type", filters.document_type as "pdf" | "word" | "excel" | "image" | "other");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Dokümanlar alınamadı.");
  }

  return data as unknown as DocumentWithRelations[];
}

export async function getDocumentById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_documents")
    .select("*, category:category_id(id, name), uploader:uploaded_by(id, full_name)")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as DocumentWithRelations;
}

export async function getLibraryDashboardData() {
  const supabase = await createSupabaseServerClient();

  const { count: totalBooks } = await supabase
    .from("library_books")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: bookCounts } = await supabase
    .from("library_books")
    .select("total_count, available_count");

  const totalCopies = (bookCounts ?? []).reduce((sum, b) => sum + (b.total_count ?? 0), 0);
  const availableCopies = (bookCounts ?? []).reduce((sum, b) => sum + (b.available_count ?? 0), 0);

  const { count: borrowedCount } = await supabase
    .from("library_loans")
    .select("id", { count: "exact", head: true })
    .eq("status", "borrowed");

  const today = new Date().toISOString().split("T")[0];
  const { data: overdue } = await supabase
    .from("library_loans")
    .select("id")
    .eq("status", "borrowed")
    .lt("due_date", today);

  const { count: totalDocuments } = await supabase
    .from("library_documents")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return {
    totalBooks: totalBooks ?? 0,
    totalCopies,
    availableCopies,
    borrowedCount: borrowedCount ?? 0,
    overdueCount: (overdue ?? []).length,
    totalDocuments: totalDocuments ?? 0,
  };
}

export async function getCategoryBookCounts() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_books")
    .select("category:category_id(id, name)");

  if (error) {
    throw new Error("Kategori dağılımı alınamadı.");
  }

  const counts = new Map<string, { name: string | null; count: number }>();
  for (const book of data as unknown as Array<{ category: { id: string; name: string } | null }>) {
    const catId = book.category?.id ?? "uncategorized";
    const existing = counts.get(catId) ?? { name: book.category?.name ?? "Kategorisiz", count: 0 };
    existing.count++;
    counts.set(catId, existing);
  }

  return Array.from(counts.entries())
    .map(([id, { name, count }]) => ({ id, name: name ?? "Kategorisiz", count }))
    .sort((a, b) => b.count - a.count);
}

export async function getRecentBooks(limit = 5) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_books")
    .select("*, category:category_id(id, name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Son eklenen kitaplar alınamadı.");
  }

  return data as unknown as BookWithCategory[];
}

export async function getActiveLoans(limit = 5) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_loans")
    .select("*, book:book_id(id, title, author), student:student_id(id, full_name), profile:profile_id(id, full_name)")
    .eq("status", "borrowed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Aktif emanetler alınamadı.");
  }

  return data as unknown as LoanWithBook[];
}

export async function getOverdueLoans(limit = 10) {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("library_loans")
    .select("*, book:book_id(id, title, author), student:student_id(id, full_name), profile:profile_id(id, full_name)")
    .eq("status", "borrowed")
    .lt("due_date", today)
    .order("due_date", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error("Geciken emanetler alınamadı.");
  }

  return data as unknown as LoanWithBook[];
}
