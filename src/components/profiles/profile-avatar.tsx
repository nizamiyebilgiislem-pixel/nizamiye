import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProfileAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "default" | "sm" | "lg";
};

export function ProfileAvatar({ name, photoUrl, size = "default" }: ProfileAvatarProps) {
  return (
    <Avatar size={size} className="rounded-md">
      {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
      <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}
