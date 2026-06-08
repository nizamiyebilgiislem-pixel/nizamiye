export const auditActionLabels: Record<string, string> = {
  student_created: "Talebe oluşturuldu",
  student_updated: "Talebe bilgileri güncellendi",
  student_status_changed: "Talebe durumu değiştirildi",
  student_class_changed: "Talebe sınıfı değiştirildi",
  grade_saved: "Not girildi/güncellendi",
  evaluation_saved: "Kanaat girildi/güncellendi",
  infirmary_record_saved: "Revir kaydı oluşturuldu/güncellendi",
  document_saved: "Evrak eklendi/güncellendi",
  parent_created: "Veli oluşturuldu",
  parent_student_linked: "Veli talebeye bağlandı",
  parent_student_unlinked: "Veli talebeden bağ kaldırıldı",
  staff_profile_created: "Hoca/kullanıcı oluşturuldu",
  auth_account_created: "Auth hesabı oluşturuldu",
  auth_password_reset: "Geçici şifre atandı",
  class_course_created: "Sınıfa ders atandı",
  class_course_updated: "Derse hoca atandı",
  schedule_slot_created: "Ders programı slotu oluşturuldu",
  schedule_slot_updated: "Ders programı slotu güncellendi",
};

export const auditActionOptions = [
  { value: "", label: "Tümü" },
  ...Object.entries(auditActionLabels).map(([value, label]) => ({ value, label })),
];

export const auditEntityTypeLabels: Record<string, string> = {
  student: "Talebe",
  grade: "Not",
  evaluation: "Kanaat",
  infirmary_record: "Revir",
  document: "Evrak",
  parent: "Veli",
  parent_student_link: "Veli Bağı",
  staff_profile: "Kullanıcı",
  auth_account: "Auth Hesabı",
  class_course: "Ders Ataması",
  weekly_schedule_slot: "Ders Programı",
};

export const auditEntityTypeOptions = [
  { value: "", label: "Tümü" },
  ...Object.entries(auditEntityTypeLabels).map(([value, label]) => ({ value, label })),
];
