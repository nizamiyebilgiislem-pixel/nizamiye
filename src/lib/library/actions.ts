"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageBooks, canManageCategories, canManageDocuments, canManageLibrary, canManageLoans } from "@/lib/library/permissions";
import { getBookById } from "@/lib/library/queries";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Kategori adı zorunludur."),
  description: z.string().trim().optional().default(""),
});

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Kategori adı zorunludur."),
  description: z.string().trim().optional().default(""),
  is_active: z.enum(["true", "false"]),
});

const createBookSchema = z.object({
  category_id: z.string().optional().default(""),
  title: z.string().trim().min(1, "Kitap adı zorunludur."),
  author: z.string().trim().optional().default(""),
  publisher: z.string().trim().optional().default(""),
  isbn: z.string().trim().optional().default(""),
  publication_year: z.coerce.number().int("Yıl tam sayı olmalıdır.").optional().default(0),
  shelf_code: z.string().trim().optional().default(""),
  location_note: z.string().trim().optional().default(""),
  total_count: z.coerce.number().int("Nüsha tam sayı olmalıdır.").min(1, "Nüsha en az 1 olmalıdır."),
  description: z.string().trim().optional().default(""),
});

const updateBookSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().optional().default(""),
  title: z.string().trim().min(1, "Kitap adı zorunludur."),
  author: z.string().trim().optional().default(""),
  publisher: z.string().trim().optional().default(""),
  isbn: z.string().trim().optional().default(""),
  publication_year: z.coerce.number().int("Yıl tam sayı olmalıdır.").optional().default(0),
  shelf_code: z.string().trim().optional().default(""),
  location_note: z.string().trim().optional().default(""),
  total_count: z.coerce.number().int("Nüsha tam sayı olmalıdır.").min(1, "Nüsha en az 1 olmalıdır."),
  description: z.string().trim().optional().default(""),
  is_active: z.enum(["true", "false"]),
});

const createLoanSchema = z.object({
  book_id: z.string().uuid("Kitap seçilmelidir."),
  borrower_type: z.enum(["student", "profile"]),
  student_id: z.string().optional().default(""),
  profile_id: z.string().optional().default(""),
  loan_date: z.string().min(1, "Alış tarihi zorunludur."),
  due_date: z.string().optional().default(""),
  note: z.string().trim().optional().default(""),
});

export async function createCategoryAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageCategories(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createCategorySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { name, description } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: category, error } = await supabase
    .from("library_categories")
    .insert({ name, description: description || null, is_active: true })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createCategory", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_category_created",
    entityType: "library_category",
    entityId: category.id,
    title: "Kategori oluşturuldu",
    description: `${name} kategorisi oluşturuldu.`,
    afterData: { name },
  });

  revalidatePath("/kutuphane/kategoriler");
  return { success: true };
}

export async function updateCategoryAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageCategories(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateCategorySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, name, description, is_active } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("library_categories")
    .update({ name, description: description || null, is_active: is_active === "true" })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateCategory", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_category_updated",
    entityType: "library_category",
    entityId: id,
    title: "Kategori güncellendi",
    description: `${name} kategorisi güncellendi.`,
    afterData: { name, is_active: is_active === "true" },
  });

  revalidatePath("/kutuphane/kategoriler");
  return { success: true };
}

export async function createBookAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageBooks(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createBookSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { category_id, title, author, publisher, isbn, publication_year, shelf_code, location_note, total_count, description } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const available_count = total_count;

  const { data: book, error } = await supabase
    .from("library_books")
    .insert({
      category_id: category_id || null,
      title,
      author: author || null,
      publisher: publisher || null,
      isbn: isbn || null,
      publication_year: publication_year || null,
      shelf_code: shelf_code || null,
      location_note: location_note || null,
      total_count,
      available_count,
      description: description || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createBook", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_book_created",
    entityType: "library_book",
    entityId: book.id,
    title: "Kitap eklendi",
    description: `${title} eklendi.`,
    afterData: { title, author, total_count },
  });

  revalidatePath("/kutuphane/kitaplar");
  return { success: true };
}

export async function updateBookAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageBooks(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateBookSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, category_id, title, author, publisher, isbn, publication_year, shelf_code, location_note, total_count, description, is_active } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const existing = await getBookById(id);

  if (!existing) {
    return { error: "Kitap bulunamadı." };
  }

  const loanedCount = existing.total_count - existing.available_count;

  if (total_count < loanedCount) {
    return { error: `Toplam nüsha, mevcut emanet sayısından (${loanedCount}) düşük olamaz.` };
  }

  const available_count = total_count - loanedCount;

  const { error } = await supabase
    .from("library_books")
    .update({
      category_id: category_id || null,
      title,
      author: author || null,
      publisher: publisher || null,
      isbn: isbn || null,
      publication_year: publication_year || null,
      shelf_code: shelf_code || null,
      location_note: location_note || null,
      total_count,
      available_count,
      description: description || null,
      is_active: is_active === "true",
    })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateBook", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_book_updated",
    entityType: "library_book",
    entityId: id,
    title: "Kitap güncellendi",
    description: `${title} güncellendi.`,
    afterData: { title, author, total_count, is_active: is_active === "true" },
  });

  revalidatePath("/kutuphane/kitaplar");
  revalidatePath(`/kutuphane/kitaplar/${id}`);
  return { success: true };
}

export async function createLoanAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageLoans(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createLoanSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { book_id, borrower_type, student_id, profile_id, loan_date, due_date, note } = parsed.data;

  if (borrower_type === "student" && !student_id) {
    return { error: "Talebe seçilmelidir." };
  }

  if (borrower_type === "profile" && !profile_id) {
    return { error: "Personel/Hoca seçilmelidir." };
  }

  const supabase = await createSupabaseServerClient();

  const book = await getBookById(book_id);

  if (!book) {
    return { error: "Kitap bulunamadı." };
  }

  if (book.available_count <= 0) {
    return { error: "Bu kitabın mevcut nüshası bulunmamaktadır." };
  }

  const borrowerId = borrower_type === "student" ? student_id : profile_id;
  const borrowerIdField = borrower_type === "student" ? "student_id" : "profile_id";

  const { count: existingActive } = await supabase
    .from("library_loans")
    .select("id", { count: "exact", head: true })
    .eq("book_id", book_id)
    .eq(borrowerIdField, borrowerId)
    .eq("status", "borrowed");

  if (existingActive && existingActive > 0) {
    return { error: "Bu kişinin aynı kitaptan zaten aktif bir emaneti bulunmaktadır." };
  }

  const { data: loan, error: loanError } = await supabase
    .from("library_loans")
    .insert({
      book_id,
      borrower_type,
      student_id: borrower_type === "student" ? student_id : null,
      profile_id: borrower_type === "profile" ? profile_id : null,
      loan_date,
      due_date: due_date || null,
      note: note || null,
      status: "borrowed",
      given_by: profile.id,
    })
    .select("id")
    .single();

  if (loanError) {
    logSupabaseActionError({ action: "createLoan", profile, payload: parsed.data, error: loanError });
    return { error: buildFriendlyDbErrorMessage(loanError) };
  }

  const { error: updateError } = await supabase
    .from("library_books")
    .update({ available_count: book.available_count - 1 })
    .eq("id", book_id);

  if (updateError) {
    logSupabaseActionError({ action: "createLoan-updateBook", profile, payload: { book_id }, error: updateError });
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_loan_created",
    entityType: "library_loan",
    entityId: loan.id,
    title: "Emanet verildi",
    description: `${book.title} kitabı emanet verildi.`,
    afterData: { book_id, borrower_type, student_id, profile_id, loan_date, due_date },
  });

  revalidatePath("/kutuphane/emanetler");
  revalidatePath("/kutuphane/kitaplar");
  revalidatePath("/kutuphane");
  return { success: true };
}

export async function returnLoanAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageLoans(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const loanId = formData.get("loan_id") as string;

  if (!loanId) {
    return { error: "Emanet kaydı bulunamadı." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: loan } = await supabase
    .from("library_loans")
    .select("id, book_id, status")
    .eq("id", loanId)
    .single();

  if (!loan) {
    return { error: "Emanet kaydı bulunamadı." };
  }

  if (loan.status !== "borrowed") {
    return { error: "Bu emanet zaten teslim edilmiş veya kayıp işaretlenmiş." };
  }

  const today = new Date().toISOString().split("T")[0];

  const { error: loanError } = await supabase
    .from("library_loans")
    .update({ status: "returned", returned_at: today, received_by: profile.id })
    .eq("id", loanId);

  if (loanError) {
    logSupabaseActionError({ action: "returnLoan", profile, payload: { loanId }, error: loanError });
    return { error: buildFriendlyDbErrorMessage(loanError) };
  }

  const { data: book } = await supabase
    .from("library_books")
    .select("available_count, total_count")
    .eq("id", loan.book_id)
    .single();

  if (book) {
    const newAvailable = Math.min(book.available_count + 1, book.total_count);
    await supabase
      .from("library_books")
      .update({ available_count: newAvailable })
      .eq("id", loan.book_id);
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_loan_returned",
    entityType: "library_loan",
    entityId: loanId,
    title: "Emanet teslim alındı",
    description: "Kitap teslim alındı.",
    afterData: { status: "returned", returned_at: today },
  });

  revalidatePath("/kutuphane/emanetler");
  revalidatePath("/kutuphane/kitaplar");
  revalidatePath("/kutuphane");
  return { success: true };
}

export async function markLoanLostAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageLoans(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const loanId = formData.get("loan_id") as string;

  if (!loanId) {
    return { error: "Emanet kaydı bulunamadı." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: loan } = await supabase
    .from("library_loans")
    .select("id, book_id, status")
    .eq("id", loanId)
    .single();

  if (!loan) {
    return { error: "Emanet kaydı bulunamadı." };
  }

  if (loan.status !== "borrowed") {
    return { error: "Bu emanet zaten teslim edilmiş veya kayıp işaretlenmiş." };
  }

  const { error: loanError } = await supabase
    .from("library_loans")
    .update({ status: "lost", received_by: profile.id })
    .eq("id", loanId);

  if (loanError) {
    logSupabaseActionError({ action: "markLoanLost", profile, payload: { loanId }, error: loanError });
    return { error: buildFriendlyDbErrorMessage(loanError) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_loan_lost",
    entityType: "library_loan",
    entityId: loanId,
    title: "Emanet kayıp işaretlendi",
    description: "Kitap kayıp olarak işaretlendi.",
    afterData: { status: "lost" },
  });

  revalidatePath("/kutuphane/emanetler");
  revalidatePath("/kutuphane/kitaplar");
  revalidatePath("/kutuphane");
  return { success: true };
}

export async function deleteLoanAction(loanId: string) {
  const { profile } = await requireAuth();

  if (!(await canManageLibrary(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("library_loans")
    .delete()
    .eq("id", loanId);

  if (error) {
    logSupabaseActionError({ action: "deleteLoan", profile, payload: { loanId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidatePath("/kutuphane/emanetler");
  revalidatePath("/kutuphane");
  return { success: true };
}

const maxDocSizeBytes = 20 * 1024 * 1024;
const allowedDocTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png", "image/webp"]);

export async function uploadDocumentAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageDocuments(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const title = formData.get("title");
  const categoryId = formData.get("category_id");
  const description = formData.get("description") || "";
  const file = formData.get("file") as File | null;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return { error: "Doküman başlığı zorunludur." };
  }

  if (!file || file.size === 0) {
    return { error: "Dosya seçilmelidir." };
  }

  if (file.size > maxDocSizeBytes) {
    return { error: "Dosya boyutu en fazla 20 MB olabilir." };
  }

  if (!allowedDocTypes.has(file.type)) {
    return { error: "Yalnızca PDF, Word, Excel ve görsel dosyaları yüklenebilir." };
  }

  const supabase = await createSupabaseServerClient();

  const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase() || "document";
  const path = `documents/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("library-documents")
    .upload(path, Buffer.from(bytes), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[library:uploadDocument]", { path, error: uploadError });
    return { error: "Dosya yüklenemedi." };
  }

  const { data: urlData } = supabase.storage.from("library-documents").getPublicUrl(path);

  const docType = mapMimeToDocType(file.type);

  const { data: doc, error: dbError } = await supabase
    .from("library_documents")
    .insert({
      title: title.trim(),
      category_id: (categoryId && typeof categoryId === "string" && categoryId.length > 0) ? categoryId : null,
      document_type: docType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      description: (typeof description === "string" ? description.trim() : "") || null,
      uploaded_by: profile.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (dbError) {
    logSupabaseActionError({ action: "uploadDocument-insert", profile, payload: { title }, error: dbError });
    return { error: buildFriendlyDbErrorMessage(dbError) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_document_uploaded",
    entityType: "library_document",
    entityId: doc.id,
    title: "Doküman yüklendi",
    description: `${title.trim()} yüklendi.`,
    afterData: { title: title.trim(), document_type: docType },
  });

  revalidatePath("/kutuphane/dokumanlar");
  revalidatePath("/kutuphane");
  return { success: true };
}

function mapMimeToDocType(mime: string): "pdf" | "word" | "excel" | "image" | "other" {
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("word")) return "word";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "excel";
  if (mime.startsWith("image/")) return "image";
  return "other";
}

export async function deleteDocumentAction(docId: string) {
  const { profile } = await requireAuth();

  if (!(await canManageLibrary(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: doc } = await supabase
    .from("library_documents")
    .select("id")
    .eq("id", docId)
    .single();

  if (!doc) {
    return { error: "Doküman bulunamadı." };
  }

  const { error } = await supabase
    .from("library_documents")
    .update({ is_active: false })
    .eq("id", docId);

  if (error) {
    logSupabaseActionError({ action: "deleteDocument", profile, payload: { docId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidatePath("/kutuphane/dokumanlar");
  revalidatePath("/kutuphane");
  return { success: true };
}
