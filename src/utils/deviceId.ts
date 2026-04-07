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

export function validarCodigoPremium(codigoDigitado: string, deviceId: string): boolean {
  const prefix = deviceId.substring(0, 6);

  let soma = 0;
  for (let i = 0; i < deviceId.length; i++) {
    soma += deviceId.charCodeAt(i);
  }

  const hash = soma % 10000;
  const codigoEsperado = `IRON-${prefix}-${hash}`;

  return codigoDigitado.trim().toUpperCase() === codigoEsperado.toUpperCase();
}

export function abrirWhatsApp(deviceId: string): void {
  const mensagem = encodeURIComponent(
    `Fala! Vim pelo Iron Trainer 💪\n\nQuero desbloquear o Premium.\n\nMeu código é: ${deviceId}`
  );
  window.open(`https://wa.me/5544999885573?text=${mensagem}`, '_blank');
}
