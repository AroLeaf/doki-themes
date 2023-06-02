/**
 * @name Doki Theme
 * @author Leaf
 * @description Cute anime character themes for your Discord client.
 * @version 0.1.0
 * @authorLink https://github.com/AroLeaf/
 * @source https://github.com/AroLeaf/doki-themes
 */

const themes = {themes};
const wallpapers = {wallpapers};
const stickers = {stickers};

module.exports = class {
  start() {
    this.themeId = BdApi.Data.load('doki-theme', 'themeId') || '';
    this.wallpaperId = BdApi.Data.load('doki-theme', 'wallpaperId') || '';
    this.stickerId = BdApi.Data.load('doki-theme', 'stickerId') || '';
    this.updateTheme();
  }

  stop() {
    BdApi.DOM.removeStyle('doki-theme');
  }

  getSettingsRow(options) {
    const root = Object.assign(document.createElement('div'), {
      class: 'doki-theme-settings-row',
      innerHTML: /* html */`
        <input type="text" class="doki-theme-input" placeholder="${options.label} ID" value="${this[options.prop]}">
        <button class="doki-theme-save">Save</button>
      `,
    });

    const input = root.querySelector('input');
    const save = root.querySelector('button');
    save.disabled = !options.onInput(input.value);

    input.addEventListener('input', () => save.disabled = !options.onInput(input.value));
    save.addEventListener('click', () => options.onSave(input.value));

    return root;
  }

  getSettingsPanel() {
    const rows = [
      this.getSettingsRow({
        prop: 'themeId',
        label: 'Theme',
        onInput: value => !value || themes.find(theme => theme.id === value),
        onSave: value => {
          this.themeId = value;
          BdApi.Data.save('doki-theme', 'themeId', this.themeId);
          this.updateTheme();
        },
      }),
      this.getSettingsRow({
        prop: 'wallpaperId',
        label: 'Wallpaper',
        onInput: value => !value || wallpapers.find(wallpaper => wallpaper.id === value),
        onSave: value => {
          this.wallpaperId = value;
          BdApi.Data.save('doki-theme', 'wallpaperId', this.wallpaperId);
          this.updateWallpaper();
        },
      }),
      this.getSettingsRow({
        prop: 'stickerId',
        label: 'Sticker',
        onInput: value => !value || stickers.find(sticker => sticker.id === value),
        onSave: value => {
          this.stickerId = value;
          BdApi.Data.save('doki-theme', 'stickerId', this.stickerId);
          this.updateSticker();
        },
      }),
    ];

    const root = Object.assign(document.createElement('div'), {
      innerHTML: /* html */`
        <style>
          .doki-theme-settings {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .doki-theme-settings-row {
            display: flex;
            flex-direction: row;
            gap: 8px;
            flex-grow: 1;
          }

          .doki-theme-input {
            flex-grow: 1;
            padding: 8px;
            background-color: var(--background-tertiary);
            color: var(--text-normal);
            font-size: 16px;
            border: none;
            border-radius: 3px;
          }

          .doki-theme-save {
            padding: 8px 16px;
            background-color: #3875ce;
            color: var(--white-500);
            border-radius: 3px;
          }
          .doki-theme-save:hover {
            background-color: #3875ce;
          }
          .doki-theme-save:active {
            background-color: #3268b7;
          }
          .doki-theme-save:disabled {
            cursor: not-allowed;
            background-color: var(--brand-500);
            opacity: 0.5;
          }
        </style>
      `,
    });

    root.classList.add('doki-theme-settings');

    rows.forEach(row => root.appendChild(row));

    return root;
  }

  updateTheme() {
    if (!this.themeId) return BdApi.DOM.removeStyle('doki-theme');
    const theme = themes.find(theme => theme.id === this.themeId);
    if (!theme) return;
    
    BdApi.DOM.removeStyle('doki-theme');
    BdApi.DOM.addStyle('doki-theme', theme.config);
  }

  updateWallpaper() {
    if (!this.wallpaperId) return BdApi.DOM.removeStyle('doki-wallpaper');
    const wallpaper = wallpapers.find(wallpaper => wallpaper.id === this.wallpaperId);
    if (!wallpaper) return;

    BdApi.DOM.removeStyle('doki-wallpaper');
    BdApi.DOM.addStyle('doki-wallpaper', wallpaper.config);
  }

  updateSticker() {
    if (!this.stickerId) return BdApi.DOM.removeStyle('doki-sticker');
    const sticker = stickers.find(sticker => sticker.id === this.stickerId);
    if (!sticker) return;

    BdApi.DOM.removeStyle('doki-sticker');
    BdApi.DOM.addStyle('doki-sticker', sticker.config);
  }
}