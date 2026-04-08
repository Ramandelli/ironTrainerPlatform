import { Preferences } from '@capacitor/preferences';

const DEVICE_ID_KEY = 'iron_trainer_device_id';

function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const { value } = await Preferences.get({ key: DEVICE_ID_KEY });
    if (value) {
      cachedDeviceId = value;
      return value;
    }
  } catch {}

  const newId = generateDeviceId();
  cachedDeviceId = newId;
  try {
    await Preferences.set({ key: DEVICE_ID_KEY, value: newId });
  } catch {}
  return newId;
}

function gerarHashComplexo(deviceId: string): string {
  const SECRET = "F3rr0_Tr41n3r_2025!@#";
  const combined = deviceId + SECRET;

  // Round 1: weighted char sum with prime multipliers
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
  let h1 = 0;
  for (let i = 0; i < combined.length; i++) {
    h1 = (h1 * 31 + combined.charCodeAt(i) * primes[i % primes.length]) >>> 0;
  }

  // Round 2: XOR folding with device chars
  let h2 = h1;
  for (let i = 0; i < deviceId.length; i++) {
    h2 = ((h2 << 5) ^ (h2 >>> 3) ^ (deviceId.charCodeAt(i) * (i + 7))) >>> 0;
  }

  // Round 3: mix rounds
  let h3 = h1 ^ h2;
  for (let r = 0; r < 50; r++) {
    h3 = ((h3 * 2654435761) ^ (h3 >>> 16)) >>> 0;
  }

  // Generate 8-char alphanumeric hash
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  let seed = h3;
  for (let i = 0; i < 8; i++) {
    seed = ((seed * 1103515245 + 12345) ^ (h1 >>> (i * 3))) >>> 0;
    result += chars[seed % chars.length];
  }

  return result;
}

export function validarCodigoPremium(codigoDigitado: string, deviceId: string): boolean {
  const prefix = deviceId.substring(0, 4).toUpperCase();
  const hash = gerarHashComplexo(deviceId);
  const codigoEsperado = `IRON-${prefix}-${hash}`;

  return codigoDigitado.trim().toUpperCase() === codigoEsperado.toUpperCase();
}

export function abrirWhatsApp(deviceId: string): void {
  const mensagem = encodeURIComponent(
    `Fala! Vim pelo Iron Trainer 💪\n\nQuero desbloquear o Premium.\n\nMeu código é: ${deviceId}`
  );
  window.open(`https://wa.me/5544999885573?text=${mensagem}`, '_blank');
}
