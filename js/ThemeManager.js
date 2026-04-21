/**
 * ThemeManager — dark / light theme toggling.
 * Reads/writes data-theme on <html> and persists to localStorage.
 */
class ThemeManager {
  constructor(toggleBtnIds = []) {
    this.STORAGE_KEY = 'cr-theme';
    this.current = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this._apply();
    this._updateIcons();
    toggleBtnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.toggle());
    });
  }

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(this.STORAGE_KEY, this.current);
    this._apply();
    this._updateIcons();
  }

  _apply() { document.documentElement.dataset.theme = this.current; }

  _updateIcons() {
    document.querySelectorAll('.theme-icon').forEach(el => {
      el.textContent = this.current === 'dark' ? '☀' : '☾';
    });
  }
}
