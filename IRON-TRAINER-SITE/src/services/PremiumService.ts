/**
 * PremiumService
 * --------------
 * Validação Premium híbrida (online + offline) com TTL e grace period.
 *
 * Regras:
 *  - Backend emite JWT válido por 30 dias (claim `exp`).
 *  - Dias 0–19: app confia no token offline, sem revalidar.
 *  - Dias 20–29 (janela de refresh): abrindo online, revalida silenciosamente
 *    e recebe novo token de 30 dias.
 *  - Dias 30–33 (grace period, 4 dias): premium continua ativo, mas app
 *    exibe aviso pedindo para abrir online e renovar.
 *  - Dia 34+: token expira definitivamente → Premium revogado.
 */
import { Preferences } from '@capacitor/preferences';
import * as jose from 'jose';
import { VALIDATE_PREMIUM_URL, SUPABASE_ANON_KEY } from '../lib/supabaseClient';
import { getDeviceId } from '../utils/deviceId';

const TOKEN_KEY = 'iron_trainer_premium_token';
const LAST_CHECK_KEY = 'iron_trainer_premium_last_check';
const APP_VERSION = '2.0.0';

// HS256 — combinado com o backend (PREMIUM_JWT_SECRET).
const PREMIUM_JWT_SECRET = '753951';
const SECRET_BYTES = new TextEncoder().encode(PREMIUM_JWT_SECRET);

// Janelas (em segundos)
const DAY = 86_400;
export const REFRESH_WINDOW_DAYS = 10; // últimos 10 dias antes do exp
export const GRACE_DAYS = 4;           // após exp, ainda aceita
const GRACE_SECONDS = GRACE_DAYS * DAY;

export type PremiumStatus =
  | 'active'          // online confirmado
  | 'offline-valid'   // token offline dentro da validade
  | 'grace'           // token expirou mas dentro do grace period
  | 'revoked'         // backend revogou explicitamente
  | 'inactive';       // sem token ou token inválido

export interface PremiumValidationResult {
  premium: boolean;
  status: PremiumStatus;
  source: 'online' | 'offline' | 'none';
  updatedAt?: string;
  /** Timestamp (ms) do `exp` do token, se houver. */
  expiresAt?: number;
  /** true quando está no grace period ou dentro da janela de refresh sem internet. */
  needsRenewal?: boolean;
  /** Dias restantes até revogação definitiva (exp + grace). Negativo se já expirou. */
  daysUntilRevoke?: number;
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

/** Verifica assinatura ignorando `exp` (tratamos exp manualmente para suportar grace). */
async function verifyTokenSignature(
  token: string,
  deviceId: string,
): Promise<TokenClaims | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET_BYTES, {
      algorithms: ['HS256'],
      // Aceita tokens expirados até GRACE_SECONDS além do exp.
      clockTolerance: GRACE_SECONDS,
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

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
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
      // Decodifica exp para expor ao contexto.
      let expiresAt: number | undefined;
      try {
        const decoded = jose.decodeJwt(data.token);
        if (decoded.exp) expiresAt = decoded.exp * 1000;
      } catch {}
      return {
        premium: true,
        status: 'active',
        source: 'online',
        updatedAt: data.updatedAt,
        expiresAt,
        needsRenewal: false,
      };
    }

    // Revogado/inativo → limpa token local.
    await clearToken();
    return {
      premium: false,
      status: data.status,
      source: 'online',
      updatedAt: data.updatedAt,
    };
  } catch {
    // Sem internet → fallback offline.
    return validateOffline();
  }
}

/** Valida usando token local, respeitando exp + grace period. */
export async function validateOffline(): Promise<PremiumValidationResult> {
  const deviceId = await getDeviceId();
  const token = await loadToken();
  if (!token) {
    return { premium: false, status: 'inactive', source: 'none' };
  }
  const claims = await verifyTokenSignature(token, deviceId);
  if (!claims || !claims.premium) {
    return { premium: false, status: 'inactive', source: 'offline' };
  }

  const exp = typeof claims.exp === 'number' ? claims.exp : undefined;
  const now = nowSec();

  // Sem exp no token (compat): trata como válido indefinidamente.
  if (!exp) {
    return {
      premium: true,
      status: 'offline-valid',
      source: 'offline',
      needsRenewal: false,
    };
  }

  const expiresAt = exp * 1000;
  const secsToExp = exp - now;

  // Já expirou definitivamente (além do grace).
  if (secsToExp < -GRACE_SECONDS) {
    await clearToken();
    return { premium: false, status: 'inactive', source: 'offline', expiresAt };
  }

  // Dentro do grace period.
  if (secsToExp <= 0) {
    const daysUntilRevoke = Math.ceil((secsToExp + GRACE_SECONDS) / DAY);
    return {
      premium: true,
      status: 'grace',
      source: 'offline',
      expiresAt,
      needsRenewal: true,
      daysUntilRevoke,
    };
  }

  // Dentro da janela de refresh (últimos REFRESH_WINDOW_DAYS antes do exp).
  const inRefreshWindow = secsToExp <= REFRESH_WINDOW_DAYS * DAY;
  return {
    premium: true,
    status: 'offline-valid',
    source: 'offline',
    expiresAt,
    needsRenewal: inRefreshWindow,
    daysUntilRevoke: Math.ceil(secsToExp / DAY) + GRACE_DAYS,
  };
}

/** Boot: valida offline (rápido) — o contexto dispara refresh online em seguida. */
export async function getInitialPremiumState(): Promise<PremiumValidationResult> {
  return validateOffline();
}

export async function refreshPremium(): Promise<PremiumValidationResult> {
  return validateOnline();
}

export async function clearPremium(): Promise<void> {
  await clearToken();
}
