import Link from "next/link";
import { GraduationCap, Mail, MapPin, Phone, Sparkles, UserRound } from "lucide-react";

import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ActiveBadge, AuthBadge, ProfileRoleBadge } from "@/components/profiles/profile-status-badge";
import { getProfileAge } from "@/lib/account/utils";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type RichProfileCardProps = {
  profile: ProfileRow | null;
  title?: string;
  href?: string;
  emptyText?: string;
  compact?: boolean;
  showStatus?: boolean;
  showAuth?: boolean;
  className?: string;
  readOnly?: boolean;
};

export function RichProfileCard({
  profile,
  title,
  href,
  emptyText = "Henüz atama yapılmadı",
  compact = false,
  showStatus = false,
  showAuth = false,
  className,
}: RichProfileCardProps) {
  if (!profile) {
    return (
      <div className={cn("rounded-md border border-dashed border-border bg-[#f8fafc] p-4", className)}>
        {title ? <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p> : null}
        <p className={cn("mt-2 font-medium text-[#093657]", compact ? "text-sm" : "text-base")}>{emptyText}</p>
      </div>
    );
  }

  const age = getProfileAge(profile.birth_date);
  const content = (
    <div className="flex items-start gap-3">
      <ProfileAvatar name={profile.full_name} photoUrl={profile.photo_url} size={compact ? "default" : "lg"} />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-2">
          {title ? <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p> : null}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn("truncate font-semibold text-[#093657]", compact ? "text-sm" : "text-base")}>{profile.full_name}</p>
              {compact ? null : profile.email ? <p className="truncate text-sm text-muted-foreground">{profile.email}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <ProfileRoleBadge role={profile.role} />
              {showStatus ? <ActiveBadge isActive={profile.is_active} /> : null}
              {showAuth ? <AuthBadge authUserId={profile.auth_user_id} /> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.phone ? <MetaChip icon={Phone} text={profile.phone} /> : null}
          {compact ? null : profile.email ? <MetaChip icon={Mail} text={profile.email} /> : null}
          {profile.hometown ? <MetaChip icon={MapPin} text={profile.hometown} /> : null}
          {age ? <MetaChip icon={UserRound} text={`${age} yaş`} /> : null}
          {profile.school_name ? <MetaChip icon={GraduationCap} text={profile.school_name} /> : null}
          {profile.expertise_area ? <MetaChip icon={Sparkles} text={profile.expertise_area} /> : null}
        </div>

        {compact ? null : profile.biography ? <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{profile.biography}</p> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={cn("block rounded-md border border-border bg-white p-4 shadow-sm transition-colors hover:bg-[#f4f8fc]", className)}>
        {content}
      </Link>
    );
  }

  return <div className={cn("rounded-md border border-border bg-white p-4 shadow-sm", className)}>{content}</div>;
}

function MetaChip({
  icon: Icon,
  text,
}: {
  icon: typeof Phone;
  text: string;
}) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border border-[#093657]/15 bg-[#f8fafc] px-2.5 py-1 text-xs text-[#093657]">
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{text}</span>
    </span>
  );
}
