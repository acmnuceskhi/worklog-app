/**
 * Returns the inline script string injected into <head> at build time.
 * Runs before React hydration to prevent flash of unstyled content (FOUC).
 * Kept as a plain string (not JSX) so it can be referenced from layout.tsx.
 */
export function getThemeScriptContent(): string {
  return `(function(){try{var t=localStorage.getItem('contentTheme');var d=document.documentElement;var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=(t==='dark'||t==='light')?t:(m?'dark':'light');d.setAttribute('data-theme',theme);d.setAttribute('color-scheme',theme);}catch(e){}})();`;
}
