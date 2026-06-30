import type { UserRole } from "@/types/rbac";

const topViewerRoles: UserRole[] = ["admin", "genel_mudur", "yonetim"];
const staffRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const staffViewerRoles: UserRole[] = [...topViewerRoles, "bolum_muduru", "hoca"];
const guidanceDashboardRoles: UserRole[] = [...staffViewerRoles, "rehberlik", "destek_birim_muduru"];
const staffAndSupportRoles: UserRole[] = [...staffViewerRoles, "destek_birim_muduru"];
const managerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru"];
const topManagerRoles: UserRole[] = ["admin", "genel_mudur"];
const parentManagerRoles: UserRole[] = [...staffAndSupportRoles];
const allRoles: UserRole[] = [...topViewerRoles, "bolum_muduru", "hoca", "veli", "destek_birim_muduru"];
const accountRoles: UserRole[] = [...allRoles, "muhasebe"];
const assistantRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "kutuphane_gorevlisi", "destek_birim_muduru", "rehberlik", "veli"];
const talepViewRoles: UserRole[] = ["admin", "genel_mudur", "yonetim", "bolum_muduru", "destek_birim_muduru"];
const talepCreateRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "destek_birim_muduru"];
const talepManageRoles: UserRole[] = ["admin", "genel_mudur"];
const taskViewRoles: UserRole[] = ["admin", "genel_mudur", "yonetim", "bolum_muduru", "hoca", "destek_birim_muduru", "kutuphane_gorevlisi"];
const libraryStaffRoles: UserRole[] = ["admin", "genel_mudur", "kutuphane_gorevlisi"];
const libraryViewRoles: UserRole[] = ["admin", "genel_mudur", "yonetim", "kutuphane_gorevlisi", "bolum_muduru", "hoca", "destek_birim_muduru"];
const guidanceStaffRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik"];
const guidanceViewRoles: UserRole[] = ["admin", "genel_mudur", "yonetim", "rehberlik", "bolum_muduru", "hoca"];
const liveSessionViewRoles: UserRole[] = ["admin", "genel_mudur", "yonetim", "bolum_muduru", "hoca", "rehberlik", "destek_birim_muduru", "kutuphane_gorevlisi"];
const liveSessionManageRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "rehberlik", "destek_birim_muduru", "kutuphane_gorevlisi"];
const messagingRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli", "destek_birim_muduru"];

export const routePermissions: Record<string, UserRole[]> = {
  "/dashboard": guidanceDashboardRoles,
  "/veli": ["veli"],
  "/hesabim": accountRoles,
  "/hesabim/profil": accountRoles,
  "/hesabim/guvenlik": accountRoles,
  "/veliler": [...parentManagerRoles, "rehberlik"],
  "/veliler/yeni": managerRoles,
  "/veliler/[id]/duzenle": managerRoles,
  "/veliler/[id]/talebeler": managerRoles,
  "/talebeler": [...staffAndSupportRoles, "rehberlik"],
  "/talebeler/yeni": managerRoles,
  "/talebeler/[id]/duzenle": staffRoles,
  "/talebeler/arsiv": managerRoles,
  "/talebeler/[id]/pdf": allRoles,
  "/talebeler/[id]/notlar/pdf": allRoles,
  "/talebeler/[id]/kanaat/pdf": allRoles,
  "/talebeler/[id]/revir/pdf": allRoles,
  "/hocalar": staffAndSupportRoles,
  "/hocalar/yeni": topManagerRoles,
  "/bolumler": [...staffAndSupportRoles, "rehberlik"],
  "/bolumler/yeni": topManagerRoles,
  "/bolumler/[id]/pdf": [...staffAndSupportRoles, "rehberlik"],
  "/siniflar": staffAndSupportRoles,
  "/siniflar/yeni": managerRoles,
  "/siniflar/[id]/pdf": staffAndSupportRoles,
  "/not-sistemi": staffAndSupportRoles,
  "/not-sistemi/dersler": staffAndSupportRoles,
  "/not-sistemi/dersler/yeni": managerRoles,
  "/not-sistemi/donemler": staffAndSupportRoles,
  "/not-sistemi/not-girisi": staffAndSupportRoles,
  "/yoklama": staffAndSupportRoles,
  "/yoklama/yeni": staffRoles,
  "/yoklama/raporlar": staffAndSupportRoles,
  "/egitim-planlama": staffAndSupportRoles,
  "/egitim-planlama/ders-atamalari": staffAndSupportRoles,
  "/egitim-planlama/ders-programi": staffAndSupportRoles,
  "/ders-notlari": staffRoles,
  "/ders-notlari/haftalik-rapor": staffRoles,
  "/ders-notlari/aylik-rapor": topManagerRoles,
  "/kanaat-sistemi": staffAndSupportRoles,
  "/kanaat-sistemi/kanaat-girisi": staffAndSupportRoles,
  "/hafizlik": [...staffViewerRoles, "rehberlik"],
  "/hafizlik/guncelle": staffRoles,
  "/yatakhane": staffAndSupportRoles,
  "/yatakhane/yeni": managerRoles,
  "/yatakhane/[id]": staffAndSupportRoles,
  "/yatakhane/[id]/duzenle": managerRoles,
  "/yatakhane/[id]/yerlestir": managerRoles,
  "/revir": staffAndSupportRoles,
  "/revir-sistemi": staffAndSupportRoles,
  "/duyurular": [...staffAndSupportRoles, "rehberlik"],
  "/duyurular/yeni": ["admin", "genel_mudur", "rehberlik"],
  "/duyurular/[id]": [...staffAndSupportRoles, "rehberlik"],
  "/duyurular/[id]/duzenle": topManagerRoles,
  "/evraklar": staffAndSupportRoles,
  "/evrak-yonetimi": managerRoles,
  "/raporlar": allRoles,

  "/raporlar/siniflar": allRoles,
  "/raporlar/bolumler": allRoles,
  "/raporlar/notlar": allRoles,
  "/raporlar/kanaatler": allRoles,
  "/raporlar/revir": allRoles,
  "/raporlar/yoklama": allRoles,
  "/raporlar/namaz-yoklama": allRoles,
  "/raporlar/donem-sonu": allRoles,
  "/raporlar/yatakhane": staffAndSupportRoles,
  "/raporlar/kutuphane": libraryViewRoles,
  "/raporlar/rehberlik": [...guidanceViewRoles, "rehberlik"],
  "/raporlar/gorevler": staffAndSupportRoles,
  "/raporlar/talepler": talepViewRoles,
  "/raporlar/evraklar": staffAndSupportRoles,
  "/audit-log": topViewerRoles,
  "/sistem/arsiv-merkezi": topManagerRoles,
  "/sistem/donem-yonetimi": topManagerRoles,
  "/sistem/donem-yonetimi/[id]": topManagerRoles,
  "/sistem/donem-sonlandirma": topManagerRoles,
  "/kullanicilar": topViewerRoles,
  "/kullanicilar/[id]": topViewerRoles,
  "/kullanicilar/yeni": topManagerRoles,
  "/kullanicilar/[id]/duzenle": topManagerRoles,
  "/ayarlar": ["admin"],
  "/ayarlar/modul-yetkilileri": topManagerRoles,
  "/kutuphane": libraryViewRoles,
  "/kutuphane/kitaplar": libraryViewRoles,
  "/kutuphane/kitaplar/yeni": libraryStaffRoles,
  "/kutuphane/kitaplar/[id]": libraryViewRoles,
  "/kutuphane/kitaplar/[id]/duzenle": libraryStaffRoles,
  "/kutuphane/emanetler": libraryViewRoles,
  "/kutuphane/emanetler/yeni": libraryStaffRoles,
  "/kutuphane/emanetler/[id]": libraryViewRoles,
  "/kutuphane/dokumanlar": libraryViewRoles,
  "/kutuphane/dokumanlar/yeni": libraryStaffRoles,
  "/kutuphane/kategoriler": libraryStaffRoles,
  "/kutuphane/raporlar": libraryViewRoles,
  "/rehberlik": [...guidanceViewRoles, "rehberlik"],
  "/rehberlik/gorusmeler": guidanceViewRoles,
  "/rehberlik/gorusmeler/yeni": guidanceStaffRoles,
  "/rehberlik/gorusmeler/[id]": guidanceViewRoles,
  "/rehberlik/gorusmeler/[id]/duzenle": guidanceStaffRoles,
  "/rehberlik/takipler": guidanceViewRoles,
  "/rehberlik/takipler/yeni": guidanceStaffRoles,
  "/rehberlik/takipler/[id]": guidanceViewRoles,
  "/rehberlik/anketler": guidanceViewRoles,
  "/rehberlik/anketler/yeni": guidanceStaffRoles,
  "/rehberlik/anketler/[id]": guidanceViewRoles,
  "/rehberlik/anketler/[id]/sonuclar": guidanceViewRoles,
  "/rehberlik/etkinlikler": guidanceViewRoles,
  "/rehberlik/etkinlikler/yeni": guidanceStaffRoles,
  "/rehberlik/etkinlikler/[id]": guidanceViewRoles,
  "/rehberlik/raporlar": guidanceViewRoles,
  "/talepler": talepViewRoles,
  "/talepler/yeni": talepCreateRoles,
  "/talepler/[id]": talepViewRoles,
  "/talepler/[id]/duzenle": talepManageRoles,
  "/gorevler": taskViewRoles,
  "/gorevler/yeni": managerRoles,
  "/gorevler/[id]": taskViewRoles,
  "/gorevler/[id]/duzenle": topManagerRoles,
  "/ders-sistemi": managerRoles,
  "/ders-sistemi/yeni": managerRoles,
  "/ders-sistemi/[id]/duzenle": managerRoles,
  "/canli-oturumlar": liveSessionViewRoles,
  "/canli-oturumlar/yeni": liveSessionManageRoles,
  "/canli-oturumlar/[id]": liveSessionViewRoles,
  "/canli-oturumlar/[id]/duzenle": liveSessionManageRoles,
  "/canli-oturumlar/[id]/katil": liveSessionManageRoles,
  "/asistan": assistantRoles,
  "/mesajlar": messagingRoles,
  "/mesajlar/yeni": messagingRoles,
  "/mesajlar/[id]": messagingRoles,
  "/sponsor": ["sponsor"],
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  genel_mudur: "Genel Müdür",
  yonetim: "Yönetim",
  bolum_muduru: "Bölüm Müdürü",
  hoca: "Hoca",
  kutuphane_gorevlisi: "Kütüphane Görevlisi",
  rehberlik: "Rehberlik",
  veli: "Veli",
  sponsor: "Sponsor",
  destek_birim_muduru: "Destek Birim Müdürü",
  muhasebe: "Muhasebe",
};

export function getRouteAllowedRoles(pathname: string) {
  const matchedPath = Object.keys(routePermissions)
    .filter((routePath) => matchesRoutePath(pathname, routePath))
    .sort((left, right) => right.length - left.length)[0];

  return matchedPath ? routePermissions[matchedPath] : undefined;
}

export function getDefaultPathForRole(role: UserRole) {
  if (role === "muhasebe") return "/hesabim";
  if (role === "yonetim") return "/dashboard";
  return role === "veli" ? "/veli" : "/dashboard";
}

function matchesRoutePath(pathname: string, routePath: string) {
  if (pathname === routePath || pathname.startsWith(`${routePath}/`)) {
    return true;
  }

  if (!routePath.includes("[")) {
    return false;
  }

  const routeSegments = routePath.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);

  if (routeSegments.length !== pathSegments.length) {
    return false;
  }

  return routeSegments.every((segment, index) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return pathSegments[index].length > 0;
    }

    return segment === pathSegments[index];
  });
}
