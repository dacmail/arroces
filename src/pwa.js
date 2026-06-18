// =============================================================================
// pwa.js — Registro del service worker y gestión del prompt de instalación.
// =============================================================================

import { registerSW } from 'virtual:pwa-register';

export function initPWA({ onToast } = {}) {
  // Service worker (auto-update). Avisa cuando hay app lista offline.
  registerSW({
    immediate: true,
    onOfflineReady() {
      onToast?.('Lista para usar sin conexión');
    },
  });

  const installBtn = document.getElementById('install-btn');
  if (!installBtn) return;

  let deferredPrompt = null;
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // Android / Chromium: evento nativo de instalación.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone) installBtn.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    deferredPrompt = null;
    onToast?.('App instalada');
  });

  // iOS/Safari no dispara beforeinstallprompt: mostramos instrucciones.
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  if (isIOS && !isStandalone) {
    installBtn.hidden = false;
  }

  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
    } else if (isIOS) {
      onToast?.('En Safari: Compartir → «Añadir a pantalla de inicio»');
    }
  });
}
