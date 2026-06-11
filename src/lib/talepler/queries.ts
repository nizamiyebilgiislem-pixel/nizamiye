import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow, TalepRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

export const talepUnitRoles: Record<string, UserRole[]> = {
  destek: ["destek_birim_muduru"],
};

export const statusLabels: Record<string, string> = {
  bekliyor: "Bekliyor",
  incelemede: "İncelemede",
  isleme_alindi: "İşleme Alındı",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  tamamlandi: "Tamamlandı",
  iptal_edildi: "İptal Edildi",
};

export const priorityLabels: Record<string, string> = {
  normal: "Normal",
  acil: "Acil",
};

export type TalepWithProfiles = TalepRow & {
  requester: { id: string; full_name: string } | null;
  assignee: { id: string; full_name: string } | null;
  target: { id: string; full_name: string } | null;
};

export async function getUnitOptions(): Promise<{ value: string; label: string }[]> {
  const supabase = createSupabaseAdminClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const options: { value: string; label: string }[] = [
    { value: "", label: "Birim seçin" },
  ];

  if (departments) {
    for (const d of departments) {
      options.push({ value: d.id, label: d.name });
    }
  }

  options.push({ value: "destek", label: "Destek Birimi" });

  return options;
}

export async function getUnitLabel(value: string): Promise<string> {
  if (value === "destek") return "Destek Birimi";
  if (value === "muhasebe") return "Muhasebe Birimi";

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("departments").select("name").eq("id", value).maybeSingle();
  return data?.name ?? value;
}

export async function getTalepler(profile: ProfileRow, page?: number, pageSize = 20): Promise<{ data: TalepWithProfiles[]; count: number }> {
  const supabase = createSupabaseAdminClient();
  const selectFields = "*, requester:requested_by(id, full_name), assignee:assigned_to(id, full_name), target:target_person(id, full_name)";

  let query = supabase
    .from("talepler")
    .select(selectFields, { count: "exact" })
    .order("created_at", { ascending: false });

  if (["admin", "genel_mudur"].includes(profile.role)) {
    // No additional filters needed
  } else {
    const handlerUnits: string[] = [];
    if (profile.role === "destek_birim_muduru") handlerUnits.push("destek");
    if (profile.role === "bolum_muduru" && profile.department_id) handlerUnits.push(profile.department_id);

    if (handlerUnits.length > 0) {
      const unitFilters = handlerUnits.map((u) => `requested_unit.eq.${u}`).join(",");
      query = query.or(`requested_by.eq.${profile.id},or(${unitFilters})`);
    } else {
      query = query.eq("requested_by", profile.id);
    }
  }

  if (page !== undefined) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, count } = await query;
  return { data: (data ?? []) as unknown as TalepWithProfiles[], count: count ?? 0 };
}

export async function getRecentTalepler(profile: ProfileRow, limit = 5): Promise<TalepWithProfiles[]> {
  const supabase = createSupabaseAdminClient();
  const selectFields = "*, requester:requested_by(id, full_name), assignee:assigned_to(id, full_name), target:target_person(id, full_name)";

  if (["admin", "genel_mudur"].includes(profile.role)) {
    const { data } = await supabase
      .from("talepler")
      .select(selectFields)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as unknown as TalepWithProfiles[];
  }

  const handlerUnits: string[] = [];
  if (profile.role === "destek_birim_muduru") handlerUnits.push("destek");
  if (profile.role === "bolum_muduru" && profile.department_id) handlerUnits.push(profile.department_id);

  const query = supabase
    .from("talepler")
    .select(selectFields)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (handlerUnits.length > 0) {
    const unitFilters = handlerUnits.map((u) => `requested_unit.eq.${u}`).join(",");
    const { data } = await query.or(`requested_by.eq.${profile.id},or(${unitFilters})`);
    return (data ?? []) as unknown as TalepWithProfiles[];
  }

  const { data } = await query.eq("requested_by", profile.id);
  return (data ?? []) as unknown as TalepWithProfiles[];
}

export async function getTalepById(id: string): Promise<TalepWithProfiles | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("talepler")
    .select("*, requester:requested_by(id, full_name), assignee:assigned_to(id, full_name), target:target_person(id, full_name)")
    .eq("id", id)
    .single();
  return data as TalepWithProfiles | null;
}

export async function getTalepCounts(profile: ProfileRow) {
  const { data: talepler } = await getTalepler(profile);

  return {
    total: talepler.length,
    bekliyor: talepler.filter((t) => t.status === "bekliyor").length,
    incelemede: talepler.filter((t) => t.status === "incelemede").length,
    isleme_alindi: talepler.filter((t) => t.status === "isleme_alindi").length,
    onaylandi: talepler.filter((t) => t.status === "onaylandi").length,
    reddedildi: talepler.filter((t) => t.status === "reddedildi").length,
    tamamlandi: talepler.filter((t) => t.status === "tamamlandi").length,
    iptal_edildi: talepler.filter((t) => t.status === "iptal_edildi").length,
    acil: talepler.filter((t) => t.priority === "acil").length,
    gelen: talepler.filter((t) => t.requested_by !== profile.id).length,
    giden: talepler.filter((t) => t.requested_by === profile.id).length,
  };
}
