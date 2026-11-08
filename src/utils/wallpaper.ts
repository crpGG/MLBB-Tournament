export const WALLPAPERS = Array.from({ length: 10 }, (_, i) => `/assets/login/bg${i + 1}.jpg`);
const KEY = 'wallpaper';

/** Satu wallpaper per sesi tab: dipakai sebagai latar aplikasi. */
export function sessionWallpaper(): string {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && WALLPAPERS.includes(saved)) return saved;
    const pick = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
    sessionStorage.setItem(KEY, pick);
    return pick;
  } catch {
    return WALLPAPERS[0];
  }
}
