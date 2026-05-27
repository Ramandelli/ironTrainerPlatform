/**
 * PremiumService
 * --------------
 * Arquitetura de validação Premium híbrida (online + offline).
 *
 * Fluxo:
 *  1. App envia { deviceId, appVersion } para a Edge Function `validate-premium`.
 *  2. Backend responde com { premium, status, token, updatedAt }.
 *     - `token` é um JWT assinado em HS256 contendo { deviceId, premium, exp }.
 *  3. Token é persistido localmente (Capacitor Preferences).
 *  4. Sem internet: verificamos a assinatura local com PREMIUM_JWT_SECRET.
 *
 * Observação de segurança:
 *  - O segredo HS256 fica embutido no app (necessário para validação offline).
 *    Aceitável para o modelo de negócio (1 licença = 1 DeviceID, ativação manual).
 *  - Premium pode ser revogado online a qualquer momento pelo admin → app
 *    detecta na próxima validação e bloqueia.
 */
import { Preferences } from '@capacitor/preferences';
import * as jose from 'jose';
import { VALIDATE_PREMIUM_URL, SUPABASE_ANON_KEY } from '../lib/supabaseClient';
import { getDeviceId } from '../utils/deviceId';

const TOKEN_KEY = 'iron_trainer_premium_token';
const LAST_CHECK_KEY = 'iron_trainer_premium_last_check';
const APP_VERSION = '2.0.0';

// HS256 secret — combinado com o backend (PREMIUM_JWT_SECRET).
// Em produção, gerar segredo forte e rotacionar via build secret.
const PREMIUM_JWT_SECRET = '753951';
const SECRET_BYTES = new TextEncoder().encode(PREMIUM_JWT_SECRET);

export type PremiumStatus = 'active' | 'revoked' | 'inactive' | 'offline-valid';

export interface PremiumValidationResult {
  premium: boolean;
  status: PremiumStatus;
  source: 'online' | 'offline' | 'none';
  updatedAt?: string;
}

interface ValidateResponse {
  premium: boolean;
  status: 'active' | 'revoked' | 'inactive';
  token?: string;
  updatedAt?: string;
}

interface TokenClaims extends jose.JWTPayload {
  deviceId: string;
  premium: boolean;
}

/** Verifica a assinatura do token localmente (offline). */
async function verifyTokenOffline(
  token: string,
  deviceId: string,
): Promise<TokenClaims | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET_BYTES, {
      algorithms: ['HS256'],
    });
    const claims = payload as TokenClaims;
    if (claims.deviceId !== deviceId) return null;
    return claims;
  } catch {
    return null;
  }
}

async function saveToken(token: string) {
  await Preferences.set({ key: TOKEN_KEY, value: token });
  await Preferences.set({ key: LAST_CHECK_KEY, value: new Date().toISOString() });
}

async function loadToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  return value || null;
}

async function clearToken() {
  await Preferences.remove({ key: TOKEN_KEY });
}

/** Tenta validar online. Salva token quando premium=true. */
export async function validateOnline(): Promise<PremiumValidationResult> {
  const deviceId = await getDeviceId();
  try {
    const res = await fetch(VALIDATE_PREMIUM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ deviceId, appVersion: APP_VERSION }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: ValidateResponse = await res.json();

    if (data.premium && data.token) {
      await saveToken(data.token);
    } else {
      // Revogado/inativo → limpa token local para não revalidar offline.
      await clearToken();
    }

    return {
      premium: data.premium,
      status: data.status,
      source: 'online',
      updatedAt: data.updatedAt,
    };
  } catch {
    // Sem internet → tenta fallback offline.
    return validateOffline();
  }
}

/** Valida usando token local assinado. */
export async function validateOffline(): Promise<PremiumValidationResult> {
  const deviceId = await getDeviceId();
  const token = await loadToken();
  if (!token) {
    return { premium: false, status: 'inactive', source: 'none' };
  }
  const claims = await verifyTokenOffline(token, deviceId);
  if (!claims || !claims.premium) {
    return { premium: false, status: 'inactive', source: 'offline' };
  }
  return { premium: true, status: 'offline-valid', source: 'offline' };
}

/**
 * Fluxo recomendado de boot:
 *  - Carrega offline imediatamente (UI rápida).
 *  - Em paralelo, revalida online (atualiza estado se mudou).
 */
export async function getInitialPremiumState(): Promise<PremiumValidationResult> {
  return validateOffline();
}

export async function refreshPremium(): Promise<PremiumValidationResult> {
  return validateOnline();
}

export async function clearPremium(): Promise<void> {
  await clearToken();
}
