type SupabaseActionError = {
  code?: string | number | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  status?: number | null;
};

type ActionProfile = {
  id: string;
  role: string;
};

export function logSupabaseActionError(params: {
  action: string;
  profile: ActionProfile;
  payload: unknown;
  error: SupabaseActionError | null | undefined;
}) {
  const { action, profile, payload, error } = params;

  console.error(`[${action}] Supabase mutation failed`, {
    profile,
    payload,
    supabaseError: {
      code: error?.code ?? null,
      message: error?.message ?? null,
      details: error?.details ?? null,
      hint: error?.hint ?? null,
      status: error?.status ?? null,
    },
  });
}

export function buildFriendlyDbErrorMessage(error: SupabaseActionError | null | undefined) {
  const code = String(error?.code ?? "");
  const message = (error?.message ?? "").trim();

  if (code === "23505") {
    return "Aynı kayıt zaten mevcut. Lütfen farklı bir bilgi ile tekrar deneyin.";
  }

  if (code === "23502") {
    return "Zorunlu alanlardan biri eksik görünüyor. Lütfen formu kontrol edin.";
  }

  if (code === "23503") {
    return "Seçilen bağlantılı kayıt geçersiz. İlgili bölümü, sınıfı veya hocayı kontrol edin.";
  }

  if (code === "42501") {
    return "Bu işlem için veritabanı yetkisi yok. Supabase policy ve tablo yetkilerini kontrol edin.";
  }

  if (message) {
    return message;
  }

  return "Kayıt sırasında beklenmeyen bir veritabanı hatası oluştu.";
}

export function buildSaveRedirect(pathname: string, error?: SupabaseActionError | null) {
  const searchParams = new URLSearchParams({ error: "save" });
  searchParams.set("errorMessage", buildFriendlyDbErrorMessage(error));

  return `${pathname}?${searchParams.toString()}`;
}
