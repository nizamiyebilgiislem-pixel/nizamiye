import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import type { ProfileRow } from "@/types/database";

export function DepartmentManagerCard({ manager, title = "Bölüm Müdürü" }: { manager: ProfileRow | null; title?: string }) {
  return <RichProfileCard profile={manager} title={title} href={manager ? `/hocalar/${manager.id}` : undefined} />;
}
