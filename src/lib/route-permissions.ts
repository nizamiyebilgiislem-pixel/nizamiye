import type { UserRole } from "@/types/rbac";

const staffRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const guidanceDashboardRoles: UserRole[] = [...staffRoles, "rehberlik", "destek_birim_muduru"];
const staffAndSupportRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "destek_birim_muduru"];
const managerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru"];
const topManagerRoles: UserRole[] = ["admin", "genel_mudur"];
const parentManagerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "destek_birim_muduru"];
const allRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli", "destek_birim_muduru"];
const accountRoles: UserRole[] = [...allRoles, "muhasebe"];
const assistantRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "kutuphane_gorevlisi", "destek_birim_muduru", "rehberlik", "veli"];
const talepRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "destek_birim_muduru"];
const talepManageRoles: UserRole[] = ["admin", "genel_mudur"];
const libraryStaffRoles: UserRole[] = ["admin", "genel_mudur", "kutuphane_gorevlisi"];
const libraryViewRoles: UserRole[] = ["admin", "genel_mudur", "kutuphane_gorevlisi", "bolum_muduru", "hoca", "destek_birim_muduru"];
const guidanceStaffRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik"];
const guidanceViewRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru"];
const liveSessionRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "rehberlik", "destek_birim_muduru", "kutuphane_gorevlisi"];

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
  "/bolumler": staffAndSupportRoles,
  "/bolumler/yeni": topManagerRoles,
  "/bolumler/[id]/pdf": staffAndSupportRoles,
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
  "/kanaat-sistemi": staffAndSupportRoles,
  "/kanaat-sistemi/kanaat-girisi": staffAndSupportRoles,
  "/yatakhane": staffAndSupportRoles,
  "/yatakhane/yeni": managerRoles,
  "/yatakhane/[id]": staffAndSupportRoles,
  "/yatakhane/[id]/duzenle": managerRoles,
  "/yatakhane/[id]/yerlestir": managerRoles,
  "/revir": staffAndSupportRoles,
  "/revir-sistemi": staffAndSupportRoles,
  "/duyurular": staffAndSupportRoles,
  "/duyurular/yeni": topManagerRoles,
  "/duyurular/[id]": staffAndSupportRoles,
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
  "/raporlar/talepler": talepRoles,
  "/raporlar/evraklar": staffAndSupportRoles,
  "/audit-log": topManagerRoles,
  "/sistem/arsiv-merkezi": topManagerRoles,
  "/sistem/donem-yonetimi": topManagerRoles,
  "/sistem/donem-yonetimi/[id]": topManagerRoles,
  "/sistem/donem-sonlandirma": topManagerRoles,
  "/kullanicilar": topManagerRoles,
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
  "/talepler": talepRoles,
  "/talepler/yeni": talepRoles,
  "/talepler/[id]": talepRoles,
  "/talepler/[id]/duzenle": talepManageRoles,
  "/gorevler": staffAndSupportRoles,
  "/gorevler/yeni": managerRoles,
  "/gorevler/[id]": staffAndSupportRoles,
  "/gorevler/[id]/duzenle": topManagerRoles,
  "/ders-sistemi": managerRoles,
  "/ders-sistemi/yeni": managerRoles,
  "/ders-sistemi/[id]/duzenle": managerRoles,
  "/canli-oturumlar": liveSessionRoles,
  "/canli-oturumlar/yeni": liveSessionRoles,
  "/canli-oturumlar/[id]": liveSessionRoles,
  "/canli-oturumlar/[id]/duzenle": liveSessionRoles,
  "/canli-oturumlar/[id]/katil": liveSessionRoles,
  "/asistan": assistantRoles,
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  genel_mudur: "Genel Müdür",
  bolum_muduru: "Bölüm Müdürü",
  hoca: "Hoca",
  kutuphane_gorevlisi: "Kütüphane Görevlisi",
  rehberlik: "Rehberlik",
  veli: "Veli",
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
