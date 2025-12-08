const ThemeManager = (function() {
  'use strict';

  const STORAGE_KEY = 'digital-mira-theme';
  const THEME_LIGHT = 'light';
  const THEME_DARK = 'dark';

  let currentTheme = THEME_LIGHT;

  function init() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      currentTheme = savedTheme;
    } else if (prefersDark) {
      currentTheme = THEME_DARK;
    }
    
    applyTheme(currentTheme, false);
    bindEvents();
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const newTheme = e.matches ? THEME_DARK : THEME_LIGHT;
        applyTheme(newTheme, true);
      }
    });
  }

  function bindEvents() {
    document.addEventListener('click', function(e) {
      const toggle = e.target.closest('.theme-toggle');
      if (toggle) {
        toggleTheme();
      }
    });
  }

  function toggleTheme() {
    currentTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
    applyTheme(currentTheme, true);
    saveTheme(currentTheme);
  }

  function applyTheme(theme, animate) {
    const html = document.documentElement;
    
    if (animate) {
      html.classList.add('theme-transition');
      setTimeout(function() {
        html.classList.remove('theme-transition');
      }, 300);
    }
    
    html.setAttribute('data-theme', theme);
    currentTheme = theme;
    
    const toggleButtons = document.querySelectorAll('.theme-toggle');
    toggleButtons.forEach(function(btn) {
      btn.setAttribute('aria-label', 
        theme === THEME_LIGHT ? 'Switch to dark theme' : 'Switch to light theme'
      );
    });
  }

  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function getTheme() {
    return currentTheme;
  }

  function setTheme(theme) {
    if (theme === THEME_LIGHT || theme === THEME_DARK) {
      applyTheme(theme, true);
      saveTheme(theme);
    }
  }

  return {
    init: init,
    toggle: toggleTheme,
    get: getTheme,
    set: setTheme
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  ThemeManager.init();
});
