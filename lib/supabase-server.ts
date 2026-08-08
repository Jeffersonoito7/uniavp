import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

function cleanEnv(val: string | undefined): string {
  // Normaliza tanto \n literal (Vercel as vezes injeta "production\n" antes do valor)
  // quanto quebras de linha reais, e retorna o ultimo segmento nao vazio
  const normalized = (val ?? '').replace(/\\n/g, '\n')
  const lines = normalized.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)
  return lines[lines.length - 1] ?? ''
}

export function createServiceRoleClient() {
  return createServiceClient<Database>(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
