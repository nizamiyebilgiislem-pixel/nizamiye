"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteUserProfileAction } from "@/lib/profiles/actions";

type ProfileDeleteButtonProps = {
  profileId: string;
  profileName: string;
};

export function ProfileDeleteButton({ profileId, profileName }: ProfileDeleteButtonProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm(`"${profileName}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      e.preventDefault();
    }
  }

  return (
    <form action={deleteUserProfileAction} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={profileId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="mr-1.5 size-4" /> Sil
      </Button>
    </form>
  );
}
