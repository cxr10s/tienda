/**
 * theme-switch.js
 * Gestiona el tema dark/light y el switch de todas las páginas.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme';
  const DARK  = 'dark';
  const LIGHT = 'light';

  /** Aplica el tema al <html> (data-theme) y sincroniza el checkbox */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('#theme-checkbox').forEach(function (cb) {
      cb.checked = (theme === LIGHT);
    });
  }

  /** Devuelve el tema guardado o detecta la preferencia del SO */
  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch (_) { return null; }
  }

  function getPreferredTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return LIGHT;
    }
    return DARK;
  }

  /** Toggle llamado por el checkbox */
  window.toggleTheme = function (checked) {
    var theme = checked ? LIGHT : DARK;
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  };

  /* ─── Inicialización ─── */
  var initial = getSavedTheme() || getPreferredTheme();
  applyTheme(initial);

  /* Esperar al DOM para sincronizar el checkbox */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyTheme(initial);
    });
  }

  /* Escuchar cambios en preferencia del SO si no hay guardado */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? LIGHT : DARK);
      }
    });
  }
})();
