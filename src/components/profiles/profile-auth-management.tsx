"use client";

import { useState } from "react";
import { KeyRound, Link2 } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProfileRow } from "@/types/database";

type ProfileAuthManagementProps = {
  profile: ProfileRow;
  source: "hocalar" | "kullanicilar" | "veliler";
  canManage: boolean;
  canResetPassword: boolean;
  returnPath?: string;
  createAuthAction: (formData: FormData) => void | Promise<void>;
  resetPasswordAction: (formData: FormData) => void | Promise<void>;
};

export function ProfileAuthManagement({
  profile,
  source,
  canManage,
  canResetPassword,
  returnPath,
  createAuthAction,
  resetPasswordAction,
}: ProfileAuthManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordMode, setPasswordMode] = useState<"manual" | "generated">("generated");

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Auth Hesabı</CardTitle>
          <CardDescription>Bu profilin Supabase Auth giriş hesabı bağlantısı.</CardDescription>
        </div>
        <Badge variant={profile.auth_user_id ? "default" : "outline"}>
          {profile.auth_user_id ? "Auth bağlı" : "Auth bağlı değil"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {!profile.auth_user_id ? (
          <>
            <p className="text-sm text-muted-foreground">
              Bu profil henüz Supabase Auth hesabına bağlı değil.
            </p>
            {canManage ? (
              <>
                <Button type="button" variant="secondary" onClick={() => setShowCreateForm((value) => !value)}>
                  <Link2 className="size-4" aria-hidden="true" />
                  Auth Hesabı Oluştur
                </Button>
                {showCreateForm ? (
                  <form action={createAuthAction} className="space-y-3 rounded-md border border-border bg-background p-4">
                    <input type="hidden" name="profile_id" value={profile.id} />
                    <input type="hidden" name="source" value={source} />
                    {returnPath ? <input type="hidden" name="return_path" value={returnPath} /> : null}
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium">
                        E-posta
                        <Input name="email" type="email" defaultValue={profile.email ?? ""} required />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        Geçici Şifre
                        <Input name="temporary_password" type="password" minLength={8} required />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <FormSubmitButton pendingLabel="Oluşturuluyor...">Auth Hesabını Oluştur</FormSubmitButton>
                    </div>
                  </form>
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Bu profil Supabase Auth hesabına bağlı. Giriş e-postası ve şifre yönetimi server-side admin client ile yapılır.
            </p>
            {canResetPassword ? (
              <>
                <Button type="button" variant="secondary" onClick={() => setShowPasswordForm((value) => !value)}>
                  <KeyRound className="size-4" aria-hidden="true" />
                  Şifre Sıfırla
                </Button>
                {showPasswordForm ? (
                  <form action={resetPasswordAction} className="space-y-3 rounded-md border border-border bg-background p-4">
                    <input type="hidden" name="profile_id" value={profile.id} />
                    <input type="hidden" name="source" value={source} />
                    <input type="hidden" name="password_mode" value={passwordMode} />
                    {returnPath ? <input type="hidden" name="return_path" value={returnPath} /> : null}
                    <div className="grid gap-2 text-sm">
                      <span className="font-medium">Yöntem</span>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="password_mode_visible"
                          checked={passwordMode === "generated"}
                          onChange={() => setPasswordMode("generated")}
                        />
                        <span>Sistem geçici güçlü şifre üretsin</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="password_mode_visible"
                          checked={passwordMode === "manual"}
                          onChange={() => setPasswordMode("manual")}
                        />
                        <span>Şifreyi manuel gireyim</span>
                      </label>
                    </div>
                    {passwordMode === "manual" ? (
                      <label className="grid gap-2 text-sm font-medium">
                        Yeni Şifre
                        <Input name="temporary_password" type="password" minLength={8} required />
                      </label>
                    ) : (
                      <>
                        <input type="hidden" name="temporary_password" value="" />
                        <p className="text-sm text-muted-foreground">
                          Oluşturulan geçici şifre işlem sonrası yalnızca bir kez gösterilir.
                        </p>
                      </>
                    )}
                    <div className="flex justify-end">
                      <FormSubmitButton pendingLabel="Sıfırlanıyor...">Şifreyi Sıfırla</FormSubmitButton>
                    </div>
                  </form>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
