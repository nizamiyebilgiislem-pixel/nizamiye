import {
  BarChart3,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  Home,
  Library,
  Printer,
  School,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";

export type ReportCategory = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  permissionKey: string;
  badge: string;
  roles: string;
};

export const reportCategories: ReportCategory[] = [
  {
    key: "students",
    title: "Öğrenci Raporları",
    description: "Talebe temel bilgileri, sınıf, bölüm, veli ve durum bilgilerini içerir.",
    href: "/raporlar/ogrenciler",
    icon: UsersRound,
    permissionKey: "student",
    badge: "Öğrenci",
    roles: "Tüm personel",
  },
  {
    key: "classes",
    title: "Sınıf Raporları",
    description: "Sınıf mevcudu, sınıf hocası, öğrenciler, yoklama ve not özetlerini içerir.",
    href: "/raporlar/siniflar",
    icon: School,
    permissionKey: "class",
    badge: "Sınıf",
    roles: "Tüm personel",
  },
  {
    key: "departments",
    title: "Bölüm Raporları",
    description: "Bölüm bazlı öğrenci, sınıf, hoca ve akademik durum özetidir.",
    href: "/raporlar/bolumler",
    icon: Home,
    permissionKey: "department",
    badge: "Bölüm",
    roles: "Tüm personel",
  },
  {
    key: "grades",
    title: "Not Raporları",
    description: "Dönemsel not dökümleri, sınıf başarı özeti ve ders bazlı analizler.",
    href: "/raporlar/notlar",
    icon: GraduationCap,
    permissionKey: "grade",
    badge: "Not",
    roles: "Admin, GM, BM, Hoca",
  },
  {
    key: "attendance",
    title: "Yoklama Raporları",
    description: "Günlük yoklama, sınıf bazlı devamsızlık ve namaz yoklama analizleri.",
    href: "/raporlar/yoklama",
    icon: BarChart3,
    permissionKey: "attendance",
    badge: "Yoklama",
    roles: "Tüm personel",
  },
  {
    key: "evaluations",
    title: "Kanaat Raporları",
    description: "Öğrenci kanaatleri, sınıf kanaat özeti ve eksik kanaat durumu.",
    href: "/raporlar/kanaatler",
    icon: FileText,
    permissionKey: "evaluation",
    badge: "Kanaat",
    roles: "Admin, GM, BM, Hoca",
  },
  {
    key: "infirmary",
    title: "Revir Raporları",
    description: "Revir kayıtları, öğrenci bazlı sağlık geçmişi ve sık tekrarlanan kayıtlar.",
    href: "/raporlar/revir",
    icon: Stethoscope,
    permissionKey: "infirmary",
    badge: "Revir",
    roles: "Tüm personel",
  },
  {
    key: "dormitory",
    title: "Yatakhane Raporları",
    description: "Yatakhane doluluk, boş kapasite ve öğrenci yerleşim planı.",
    href: "/raporlar/yatakhane",
    icon: Home,
    permissionKey: "dormitory",
    badge: "Yatakhane",
    roles: "Admin, GM, BM, Hoca",
  },
  {
    key: "library",
    title: "Kütüphane Raporları",
    description: "Kitap listesi, emanetteki kitaplar, geciken teslimler ve ödünç geçmişi.",
    href: "/raporlar/kutuphane",
    icon: Library,
    permissionKey: "library",
    badge: "Kütüphane",
    roles: "Admin, GM, Kütüphane yetkilisi",
  },
  {
    key: "guidance",
    title: "Rehberlik Raporları",
    description: "Açık rehberlik kayıtları, takip bekleyenler ve görüşme dağılımları.",
    href: "/raporlar/rehberlik",
    icon: HeartHandshake,
    permissionKey: "guidance",
    badge: "Rehberlik",
    roles: "Admin, GM, Rehberlik yetkilisi, BM",
  },
  {
    key: "tasks",
    title: "Görev Raporları",
    description: "Açık, tamamlanan ve geciken görevlerin durum bazlı özeti.",
    href: "/raporlar/gorevler",
    icon: ClipboardList,
    permissionKey: "task",
    badge: "Görev",
    roles: "Admin, GM, BM",
  },
  {
    key: "requests",
    title: "Talep Raporları",
    description: "Birim bazlı, durum bazlı ve öncelik bazlı talep analizleri.",
    href: "/raporlar/talepler",
    icon: Printer,
    permissionKey: "request",
    badge: "Talep",
    roles: "Admin, GM, BM, Rehberlik, Destek BM",
  },
  {
    key: "documents",
    title: "Evrak Raporları",
    description: "Evrak listesi, öğrenci bazlı evraklar, eksik evrak ve tarih aralığı raporları.",
    href: "/raporlar/evraklar",
    icon: FileText,
    permissionKey: "document",
    badge: "Evrak",
    roles: "Tüm personel",
  },
];

export const reportPermissionKeys = reportCategories.map((c) => c.permissionKey);
