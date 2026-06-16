import { getProfileModuleKeys } from "@/lib/module-assignments/queries";
import type { ProfileRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

export type NavigationItem = {
  label: string;
  href: string;
  iconKey: string;
  allowedRoles: UserRole[];
  moduleKey?: string;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const staffRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "destek_birim_muduru"];
const guidanceDashboardRoles: UserRole[] = [...staffRoles, "rehberlik"];
const topManagerRoles: UserRole[] = ["admin", "genel_mudur"];
const managerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru"];
const academicTermViewerRoles: UserRole[] = ["bolum_muduru"];
const parentManagerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "destek_birim_muduru"];
const allRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli", "destek_birim_muduru"];
const accountRoles: UserRole[] = [...allRoles, "muhasebe"];
const assistantRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "kutuphane_gorevlisi", "destek_birim_muduru", "rehberlik", "veli"];
const libraryRoles: UserRole[] = ["admin", "genel_mudur", "kutuphane_gorevlisi", "bolum_muduru", "hoca", "destek_birim_muduru"];
const guidanceRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru"];
const talepRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "destek_birim_muduru"];
const taskRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "destek_birim_muduru", "kutuphane_gorevlisi"];
const liveSessionRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "rehberlik", "destek_birim_muduru", "kutuphane_gorevlisi"];
const messagingRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli", "destek_birim_muduru"];

export const moduleGroups: NavigationGroup[] = [
  {
    label: "Genel",
    items: [
      { label: "Yönetim Paneli", href: "/dashboard", iconKey: "dashboard", allowedRoles: guidanceDashboardRoles },
      { label: "Nizam Aİ", href: "/asistan", iconKey: "assistant", allowedRoles: assistantRoles, moduleKey: "assistant" },
      { label: "Veli Paneli", href: "/veli", iconKey: "home", allowedRoles: ["veli"] },
      { label: "Hesabım", href: "/hesabim", iconKey: "user", allowedRoles: accountRoles },
      { label: "Talebeler", href: "/talebeler", iconKey: "students", allowedRoles: [...staffRoles, "rehberlik"] },
      { label: "Veliler", href: "/veliler", iconKey: "users", allowedRoles: [...parentManagerRoles, "rehberlik"] },
      { label: "Hocalar", href: "/hocalar", iconKey: "teachers", allowedRoles: staffRoles },
      { label: "Bölümler", href: "/bolumler", iconKey: "departments", allowedRoles: staffRoles },
      { label: "Sınıflar", href: "/siniflar", iconKey: "classes", allowedRoles: staffRoles },
      { label: "Mesajlar", href: "/mesajlar", iconKey: "messages", allowedRoles: messagingRoles, moduleKey: "messaging" },
    ],
  },
  {
    label: "Akademik",
    items: [
      { label: "Ders Sistemi", href: "/ders-sistemi", iconKey: "grades", allowedRoles: managerRoles },
      { label: "Not Girişi", href: "/not-sistemi/not-girisi", iconKey: "grades", allowedRoles: staffRoles },
      { label: "Dönemler", href: "/not-sistemi/donemler", iconKey: "calendar", allowedRoles: academicTermViewerRoles },
      { label: "Eğitim Planlama", href: "/egitim-planlama", iconKey: "calendar", allowedRoles: staffRoles },
      { label: "Kanaat Sistemi", href: "/kanaat-sistemi", iconKey: "evaluations", allowedRoles: staffRoles },
      { label: "Hafızlık Takibi", href: "/hafizlik", iconKey: "book", allowedRoles: managerRoles },
      { label: "Yoklama", href: "/yoklama", iconKey: "attendance", allowedRoles: staffRoles },
      { label: "Yatakhane Yönetimi", href: "/yatakhane", iconKey: "dormitory", allowedRoles: staffRoles },
      { label: "Revir Sistemi", href: "/revir", iconKey: "infirmary", allowedRoles: staffRoles, moduleKey: "infirmary" },
      { label: "Kütüphane", href: "/kutuphane", iconKey: "library", allowedRoles: libraryRoles, moduleKey: "library" },
      { label: "Canlı Oturumlar", href: "/canli-oturumlar", iconKey: "video", allowedRoles: liveSessionRoles },
      { label: "Rehberlik", href: "/rehberlik", iconKey: "guidance", allowedRoles: [...guidanceRoles, "rehberlik"] },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { label: "Duyurular", href: "/duyurular", iconKey: "announcements", allowedRoles: staffRoles },
      { label: "Evrak Yönetimi", href: "/evraklar", iconKey: "documents", allowedRoles: staffRoles },
      { label: "Audit Log", href: "/audit-log", iconKey: "audit", allowedRoles: topManagerRoles },
      { label: "Raporlar", href: "/raporlar", iconKey: "evaluations", allowedRoles: allRoles },
      { label: "Kullanıcılar", href: "/kullanicilar", iconKey: "users", allowedRoles: topManagerRoles },
      { label: "Arşiv Merkezi", href: "/sistem/arsiv-merkezi", iconKey: "documents", allowedRoles: topManagerRoles },
      { label: "Dönem Yönetimi", href: "/sistem/donem-yonetimi", iconKey: "calendar", allowedRoles: topManagerRoles },
      { label: "Dönem Sonlandırma", href: "/sistem/donem-sonlandirma", iconKey: "audit", allowedRoles: topManagerRoles },
      { label: "Talep Yönetimi", href: "/talepler", iconKey: "talepler", allowedRoles: talepRoles },
      { label: "Görev Yönetimi", href: "/gorevler", iconKey: "tasks", allowedRoles: taskRoles },
      { label: "Ayarlar", href: "/ayarlar", iconKey: "settings", allowedRoles: topManagerRoles },
      { label: "Modül Yetkilileri", href: "/ayarlar/modul-yetkilileri", iconKey: "settings", allowedRoles: topManagerRoles },
    ],
  },
];

export { getDefaultPathForRole, getRouteAllowedRoles, roleLabels } from "@/lib/route-permissions";

export function getNavigationForRole(role: UserRole): NavigationGroup[] {
  return moduleGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.allowedRoles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

export async function getNavigationForProfile(profile: ProfileRow): Promise<NavigationGroup[]> {
  const moduleKeys = await getProfileModuleKeys(profile.id);

  return moduleGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.allowedRoles.includes(profile.role)) return true;
        if (item.moduleKey && moduleKeys.includes(item.moduleKey)) return true;
        return false;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
