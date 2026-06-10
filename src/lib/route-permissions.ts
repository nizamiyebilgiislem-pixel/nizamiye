import type { UserRole } from "@/types/rbac";

const staffRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const managerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru"];
const topManagerRoles: UserRole[] = ["admin", "genel_mudur"];
const parentManagerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const allRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli"];
const talepRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "rehberlik", "destek_birim_muduru", "muhasebe"];
const talepManageRoles: UserRole[] = ["admin", "genel_mudur"];
const libraryStaffRoles: UserRole[] = ["admin", "genel_mudur", "kutuphane_gorevlisi"];
const libraryViewRoles: UserRole[] = ["admin", "genel_mudur", "kutuphane_gorevlisi", "bolum_muduru", "hoca"];
const guidanceStaffRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik"];
const guidanceViewRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru", "hoca"];

export const routePermissions: Record<string, UserRole[]> = {
  "/dashboard": staffRoles,
  "/veli": ["veli"],
  "/hesabim": allRoles,
  "/hesabim/profil": allRoles,
  "/hesabim/guvenlik": allRoles,
  "/veliler": parentManagerRoles,
  "/veliler/yeni": managerRoles,
  "/talebeler": staffRoles,
  "/talebeler/yeni": managerRoles,
  "/talebeler/arsiv": managerRoles,
  "/talebeler/[id]/pdf": allRoles,
  "/talebeler/[id]/notlar/pdf": allRoles,
  "/talebeler/[id]/kanaat/pdf": allRoles,
  "/talebeler/[id]/revir/pdf": allRoles,
  "/hocalar": staffRoles,
  "/hocalar/yeni": topManagerRoles,
  "/bolumler": staffRoles,
  "/bolumler/yeni": topManagerRoles,
  "/bolumler/[id]/pdf": staffRoles,
  "/siniflar": staffRoles,
  "/siniflar/yeni": managerRoles,
  "/siniflar/[id]/pdf": staffRoles,
  "/not-sistemi": staffRoles,
  "/not-sistemi/dersler": staffRoles,
  "/not-sistemi/dersler/yeni": managerRoles,
  "/not-sistemi/donemler": staffRoles,
  "/not-sistemi/not-girisi": staffRoles,
  "/yoklama": staffRoles,
  "/yoklama/yeni": staffRoles,
  "/yoklama/raporlar": staffRoles,
  "/egitim-planlama": staffRoles,
  "/egitim-planlama/ders-atamalari": staffRoles,
  "/egitim-planlama/ders-programi": staffRoles,
  "/kanaat-sistemi": staffRoles,
  "/kanaat-sistemi/kanaat-girisi": staffRoles,
  "/yatakhane": staffRoles,
  "/yatakhane/yeni": managerRoles,
  "/yatakhane/[id]": staffRoles,
  "/yatakhane/[id]/duzenle": managerRoles,
  "/yatakhane/[id]/yerlestir": managerRoles,
  "/revir": staffRoles,
  "/revir-sistemi": staffRoles,
  "/duyurular": staffRoles,
  "/duyurular/yeni": topManagerRoles,
  "/duyurular/[id]": staffRoles,
  "/duyurular/[id]/duzenle": topManagerRoles,
  "/evraklar": staffRoles,
  "/evrak-yonetimi": managerRoles,
  "/raporlar": allRoles,
  "/raporlar/talebeler": allRoles,
  "/raporlar/siniflar": allRoles,
  "/raporlar/bolumler": allRoles,
  "/raporlar/notlar": allRoles,
  "/raporlar/kanaatler": allRoles,
  "/raporlar/revir": allRoles,
  "/raporlar/yoklama": allRoles,
  "/raporlar/namaz-yoklama": allRoles,
  "/raporlar/donem-sonu": allRoles,
  "/audit-log": staffRoles,
  "/kullanicilar": topManagerRoles,
  "/kullanicilar/yeni": topManagerRoles,
  "/kullanicilar/[id]/duzenle": topManagerRoles,
  "/ayarlar": ["admin"],
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
  "/rehberlik": guidanceViewRoles,
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
  "/gorevler": staffRoles,
  "/gorevler/yeni": managerRoles,
  "/gorevler/[id]": staffRoles,
  "/gorevler/[id]/duzenle": topManagerRoles,
  "/ders-sistemi": managerRoles,
  "/ders-sistemi/yeni": managerRoles,
  "/ders-sistemi/[id]/duzenle": managerRoles,
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
