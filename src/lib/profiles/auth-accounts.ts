import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateAuthUserParams = {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
};

export async function findAuthUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error("Supabase Auth kullanıcıları alınamadı.");
    }

    const matchedUser = (data.users ?? []).find((user) => user.email?.toLocaleLowerCase("en-US") === normalizedEmail) ?? null;

    if (matchedUser) {
      return matchedUser;
    }

    lastPage = data.lastPage ?? page;
    page += 1;
  }

  return null;
}

export async function createAuthUserAccount(params: CreateAuthUserParams) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName,
      phone: params.phone ?? null,
    },
  });

  return { user: data.user, error };
}

export async function deleteAuthUserAccount(userId: string) {
  const admin = createSupabaseAdminClient();
  return admin.auth.admin.deleteUser(userId);
}

export async function updateAuthUserPassword(userId: string, password: string) {
  const admin = createSupabaseAdminClient();
  return admin.auth.admin.updateUserById(userId, {
    password,
  });
}

export function isAuthEmailConflict(user: User | null, email: string) {
  return Boolean(user && user.email?.toLocaleLowerCase("en-US") === email.trim().toLocaleLowerCase("en-US"));
}
