/**
 * DeviceID: identificador local persistido em Capacitor Preferences.
 * 1 licença Premium = 1 DeviceID. Se o usuário formatar o celular ou
 * desinstalar o app, um novo DeviceID será gerado e o admin precisa
 * reassociar a licença manualmente no painel.
 */
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

export function abrirWhatsApp(deviceId: string): void {
  const mensagem = encodeURIComponent(
    `Fala! Vim pelo Iron Trainer 💪\n\nQuero ativar o Premium (vitalício).\n\nMeu DeviceID é: ${deviceId}`,
  );
  window.open(`https://wa.me/5544999885573?text=${mensagem}`, '_blank');
}
