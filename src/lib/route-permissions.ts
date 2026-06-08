import type { UserRole } from "@/types/rbac";

const staffRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const managerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru"];
const topManagerRoles: UserRole[] = ["admin", "genel_mudur"];
const parentManagerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const allRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli"];

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
  "/yatakhane": staffRoles,
  "/yatakhane/yeni": topManagerRoles,
  "/yatakhane/[id]": staffRoles,
  "/yatakhane/[id]/duzenle": topManagerRoles,
  "/yatakhane/katlar/[floorId]": staffRoles,
  "/yatakhane/odalar/[roomId]": staffRoles,
  "/yatakhane/yerlesim": staffRoles,
  "/yatakhane/yerlesim/yeni": managerRoles,
  "/yatakhane/yerlesim/[assignmentId]": managerRoles,
  "/yatakhane/raporlar": staffRoles,
  "/egitim-planlama": staffRoles,
  "/egitim-planlama/ders-atamalari": staffRoles,
  "/egitim-planlama/ders-programi": staffRoles,
  "/kanaat-sistemi": staffRoles,
  "/kanaat-sistemi/kanaat-girisi": staffRoles,
  "/revir": staffRoles,
  "/revir-sistemi": staffRoles,
  "/duyurular": staffRoles,
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
  "/kullanici-yonetimi": ["admin"],
  "/ayarlar": ["admin"],
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  genel_mudur: "Genel Müdür",
  bolum_muduru: "Bölüm Müdürü",
  hoca: "Hoca",
  veli: "Veli",
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
