import { FormSubmitButton } from "@/components/forms/form-submit-button";
import type { AccountProfile } from "@/lib/account/queries";

type AccountSecurityFormProps = {
  profile: AccountProfile;
  action: (formData: FormData) => void | Promise<void>;
};

export function AccountSecurityForm({ profile, action }: AccountSecurityFormProps) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Mevcut E-posta
          <input
            value={profile.email ?? ""}
            disabled
            className="h-10 rounded-md border border-input bg-[#f3f6f9] px-3 text-sm font-normal text-muted-foreground outline-none"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Yeni Şifre
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Yeni Şifre Tekrar
          <input
            name="password_confirm"
            type="password"
            minLength={8}
            required
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          />
        </label>
      </div>
      <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
        E-posta değişikliği için yönetici ile iletişime geçiniz.
      </div>
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Güncelleniyor...">Şifremi Güncelle</FormSubmitButton>
      </div>
    </form>
  );
}
