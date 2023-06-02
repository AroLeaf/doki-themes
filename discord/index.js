const { getDefinitions } = require('../shared');
const fs = require('node:fs/promises');
const path = require('node:path');
const $ = require('node:util').promisify(require('node:child_process').exec);
const { default: Color } = require('colorjs.io');
const fz = require('file-ez');
const hljs = require('../hljs');

const COLOR_STEPS = [
  0.10,
  0.13,
  0.16,
  0.20,
  0.23,
  0.26,
  0.30,
  0.33,
  0.34,
  0.36,
  0.40,
  0.43,
  0.46,
  0.50,
  0.53,
  0.56,
  0.60,
  0.63,
  0.66,
  0.70,
  0.73,
  0.76,
  0.80,
  0.83,
  0.86,
  0.90,
];

function getColorSteps(hex, name, middle = 0.5) {
  const baseColor = new Color(hex).to('hsl');
  const toWhite = baseColor.range(new Color(baseColor).set('l', 100), { space: 'hsl', outputSpace: 'hsl' });
  const toBlack = baseColor.range(new Color(baseColor).set('l', 0), { space: 'hsl', outputSpace: 'hsl' });

  return COLOR_STEPS.map(step => {
    if (step < middle) return toWhite(-(step - middle) * (1 / middle));
    if (step > middle) return toBlack((step - middle) * (1 / (1 - middle)));
    return baseColor;
  }).map((color, i) => `--${name}-${COLOR_STEPS[i] * 1000}-hsl: ${color.toString().slice(4, -1)};`).join('\n');
}


async function prepare() {
  await $(`
    rm -rf build
    mkdir -p build/themes
  `);
}


async function getThemes(definitions) {
  const hljsThemes = await hljs.buildThemes(definitions);

  const themes = definitions.map(theme => {
    const backgroundRange = new Color(theme.colors.baseBackground).range(new Color(theme.colors.secondaryBackground), { space: 'hsl', outputSpace: 'hsl' });

    return {
      id: theme.id,
      name: theme.conflictName || theme.name,
      config: /* css */`
        /**
         * @name Doki Theme: ${theme.name}
         * @author Leaf
         * @description Cute anime character themes for your Discord client.
         * @version 0.1.0
         * @authorLink https://github.com/AroLeaf/
         * @source https://github.com/AroLeaf/doki-themes
         */

        .theme-${theme.dark ? 'dark' : 'light'} {
          /* color ranges */
          ${Object.entries({
            brand: theme.colors.accentColor,
            black: theme.colors['terminal.ansiBlack'],
            blue: theme.colors['terminal.ansiBlue'],
            green: theme.colors['terminal.ansiGreen'],
            orange: theme.colors['terminal.ansiYellow'],
            red: theme.colors['terminal.ansiRed'],
            white: theme.colors['terminal.ansiLightWhite'],
            yellow: theme.colors['terminal.ansiLightYellow'],
          }).map(([name, color]) => getColorSteps(color, name)).join('\n')}

          /* background colors */
          --background-primary:       ${backgroundRange(0)};
          --background-secondary:     ${backgroundRange(1)};
          --background-secondary-alt: ${backgroundRange(1.5)};
          --background-tertiary:      ${backgroundRange(2)};

          --background-floating: ${backgroundRange(2.5)};

          --background-modifier-accent:   ${Object.assign(backgroundRange(-1), { alpha: 0.48 })};
          --background-modifier-active:   ${Object.assign(backgroundRange(-1), { alpha: 0.48 })};
          --background-modifier-hover:    ${Object.assign(backgroundRange(-1), { alpha: 0.3  })};
          --background-modifier-selected: ${Object.assign(backgroundRange(-1), { alpha: 0.6  })};
    
          --channeltextarea-background: ${backgroundRange(-1)};

          --modal-background: ${backgroundRange(0)};
          --modal-footer-background: ${backgroundRange(1)};

          --scrollbar-auto-scrollbar-color-thumb: ${backgroundRange(2.5)};
          --scrollbar-auto-scrollbar-color-track: ${backgroundRange(1)};
          --scrollbar-auto-thumb: ${backgroundRange(2.5)};
          --scrollbar-auto-track: ${backgroundRange(1)};
          --scrollbar-thin-thumb: ${backgroundRange(2.5)};
          --scrollbar-thin-track: hsl(var(--black-500-hsl)/0);

          /* foreground colors */
          --text-normal: ${theme.colors.foregroundColor};
          --text-muted: ${theme.colors.comments};

          --channel-icon: ${theme.colors.disabledColor};
          --channels-default: ${theme.colors.disabledColor};

          --interactive-active: ${theme.colors.infoForeground};
          --interactive-hover: ${theme.colors.infoForeground};
          --interactive-muted: ${theme.colors.comments};
          --interactive-normal: ${theme.colors.foregroundColor};

          --channel-text-area-placeholder: ${theme.colors.comments};

          --search-popout-option-fade: linear-gradient(90deg, ${Object.assign(backgroundRange(2.5), { alpha: 0 })}, ${backgroundRange(2.5)} 80%);
          --search-popout-option-fade-hover: linear-gradient(90deg, ${Object.assign(backgroundRange(0), { alpha: 0 })}, ${backgroundRange(0)} 50%);
          --search-popout-option-non-text-color: var(--text-normal);
          --search-popout-date-picker-border: 1px solid ${Object.assign(backgroundRange(0), { alpha: 0.3 })};
          --search-popout-date-picker-hint-text: var(--text-muted);
        }

        .buttonWrapper-3YFQGJ:hover {
          color: var(--interactive-hover);
        }

        .item-2LIpTv {
          background-color: var(--brand-500);
        }

        .theme-${theme.dark ? 'dark' : 'light'} .searchAnswer-23w-CH,
        .theme-${theme.dark ? 'dark' : 'light'} .searchFilter-2UfsDk {
          background-color: ${theme.colors.searchBackground};
          color: ${theme.colors.searchForeground};
        }

        ${hljsThemes.find(t => t.id === theme.id).config.replace(/\.hljs/g, `.theme-${theme.dark ? 'dark' : 'light'} .hljs`)}

        .theme-${theme.dark ? 'dark' : 'light'} .hljs {
          background-color: ${theme.colors.textEditorBackground};
        }
      `.replace(/\n */g, '\n').slice(1),
    };
  });

  return themes;
}


async function getBackgrounds(definitions) {
  const wallpapers = definitions.flatMap(definition => Object.entries(definition.stickers).map(([type, sticker]) => ({
    id: `${definition.name}${type === 'default' ? '' : `-${type}`}`,
    name: `${definition.conflictName || definition.name}${type === 'default' ? '' : ` (${type})`}`,
    url: `https://raw.githubusercontent.com/doki-theme/doki-theme-assets/master/backgrounds/wallpapers/transparent/${sticker.name}`,
    position: sticker.anchor,
  })).map(wallpaper => ({
    id: wallpaper.id,
    name: wallpaper.name,
    config: /* css */`
      /**
       * @name Doki Theme Wallpaper: ${wallpaper.name}
       * @author Leaf
       * @description Cute anime character themes for your Discord client.
       * @version 0.1.0
       * @authorLink https://github.com/AroLeaf/
       * @source https://github.com/AroLeaf/doki-themes
       */

      .peopleList-2VBrVI,
      .chatContent-3KubbW {
        background-image: url('${wallpaper.url}');
        background-position: ${wallpaper.position};
        background-size: cover;
      }
    `.replace(/\n */g, '\n').slice(1),
  })));

  return wallpapers;
}


async function getStickers(definitions) {
  const stickerFiles = await fz.recursive(path.resolve('../assets/stickers/vscode')).then(files => files.map(file => file.replace(/^.*assets\//, '')));
  
  const stickers = definitions.flatMap(definition => Object.entries(definition.stickers).map(([type, sticker]) => ({
    id: `${definition.name}${type === 'default' ? '' : `-${type}`}`,
    name: `${definition.conflictName || definition.name}${type === 'default' ? '' : ` (${type})`}`,
    url: `https://raw.githubusercontent.com/doki-theme/doki-theme-assets/master/${stickerFiles.find(file => file.endsWith(sticker.name))}`,
  })).map(sticker => ({
    id: sticker.id,
    name: sticker.name,
    config: /* css */`
      /**
       * @name Doki Theme Sticker: ${sticker.name}
       * @author Leaf
       * @description Cute anime character themes for your Discord client.
       * @version 0.1.0
       * @authorLink https://github.com/AroLeaf/
       * @source https://github.com/AroLeaf/doki-themes
       */

      .chatContent-3KubbW::before {
        content: '';
        pointer-events: none;
        position: absolute;
        z-index: 9001;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        background-position: 100% 100%;
        background-repeat: no-repeat;
        opacity: 1;
        background-image: url('${sticker.url}');
      }
    `.replace(/\n */g, '\n').slice(1),
  })));

  return stickers;
}


async function saveThemes(themes, wallpapers, stickers) {
  for (const theme of themes) {
    await fs.writeFile(path.resolve(`build/themes/doki-theme-${theme.id}.theme.css`), theme.config, 'utf8');
  }

  for (const wallpaper of wallpapers) {
    await fs.writeFile(path.resolve(`build/themes/doki-wallpaper-${wallpaper.id}.theme.css`), wallpaper.config, 'utf8');
  }

  for (const sticker of stickers) {
    await fs.writeFile(path.resolve(`build/themes/doki-sticker-${sticker.id}.theme.css`), sticker.config, 'utf8');
  }
}


async function savePlugin(themes, wallpapers, stickers) {
  const template = await fs.readFile(path.resolve('plugin.js'), 'utf8');
  const plugin = template
    .replace('{themes}', JSON.stringify(themes.sort((a, b) => a.name.localeCompare(b.name))))
    .replace('{wallpapers}', JSON.stringify(wallpapers.sort((a, b) => a.name.localeCompare(b.name))))
    .replace('{stickers}', JSON.stringify(stickers.sort((a, b) => a.name.localeCompare(b.name))));
  await fs.writeFile(path.resolve('build/doki-theme.plugin.js'), plugin, 'utf8');
}


async function main() {
  const definitions = await getDefinitions();
  await prepare();

  const themes = await getThemes(definitions);
  const wallpapers = await getBackgrounds(definitions);
  const stickers = await getStickers(definitions);
  
  await saveThemes(themes, wallpapers, stickers);
  await savePlugin(themes, wallpapers, stickers);
}

main();