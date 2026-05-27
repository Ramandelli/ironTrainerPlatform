/**
 * Cliente Supabase apontando para o backend do painel admin (iron-trainer-admin).
 * Estas credenciais são públicas (anon key) — seguras para embarcar no app.
 */
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://knfacgwkbmcxtonirjfu.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZmFjZ3drYm1jeHRvbmlyamZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3ODc3MzIsImV4cCI6MjA5NTM2MzczMn0.vSn-m4h-jja1EXkTbDgDkHRx-mpHBqyoU_XYH3fSmk0';

export const VALIDATE_PREMIUM_URL = `${SUPABASE_URL}/functions/v1/validate-premium`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
