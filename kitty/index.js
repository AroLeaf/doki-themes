const { getDefinitions } = require('../shared');
const fs = require('node:fs/promises');
const fz = require('file-ez');
const path = require('node:path');
const $ = require('node:util').promisify(require('node:child_process').exec);


async function prepare() {
  await $(`
    rm -rf build
    mkdir -p build/themes build/wallpapers build/stickers
  `);
}


async function buildThemes(definitions) {
  const themes = definitions.map(theme => ({
    id: theme.id,
    name: theme.conflictName || theme.name,
    config: `
      # Doki Theme: ${theme.name}
      # Theme by: Unthrottled (https://github.com/Unthrottled)
      # Kitty build by: AroLeaf (https://github.com/AroLeaf)

      foreground ${theme.colors.foregroundColor}
      background ${theme.colors.baseBackground}

      cursor ${theme.colors.accentColor}
      cursor_text_color ${theme.colors.textEditorBackground}
      
      selection_foreground ${theme.colors.selectionForeground}
      selection_background ${theme.colors.selectionBackground}

      url_color ${theme.colors.accentColor}

      active_tab_background ${theme.colors.highlightColor}
      inactive_tab_background ${theme.colors.textEditorBackground}

      # black
      color0 ${theme.colors['terminal.ansiBlack']}
      color8 ${theme.colors['terminal.ansiLightBlack']}

      # red
      color1 ${theme.colors['terminal.ansiRed']}
      color9 ${theme.colors['terminal.ansiLightRed']}

      # green
      color2  ${theme.colors['terminal.ansiGreen']}
      color10 ${theme.colors['terminal.ansiLightGreen']}

      # yellow
      color3  ${theme.colors['terminal.ansiYellow']}
      color11 ${theme.colors['terminal.ansiLightYellow']}

      # blue
      color4  ${theme.colors['terminal.ansiBlue']}
      color12 ${theme.colors['terminal.ansiLightBlue']}

      # magenta
      color5  ${theme.colors['terminal.ansiMagenta']}
      color13 ${theme.colors['terminal.ansiLightMagenta']}

      # cyan
      color6  ${theme.colors['terminal.ansiCyan']}
      color14 ${theme.colors['terminal.ansiLightCyan']}

      # white
      color7  ${theme.colors['terminal.ansiWhite']}
      color15 ${theme.colors['terminal.ansiLightWhite']}
    `.replace(/\n */g, '\n').slice(1),
  }));

  for (const theme of themes) {
    await fs.writeFile(path.resolve(`build/themes/${theme.id}.conf`), theme.config, 'utf8');
  }
}


async function buildBackgrounds(definitions) {
  const wallpapers = definitions.flatMap(definition => Object.entries(definition.stickers).map(([type, sticker]) => ({
    name: `${definition.conflictName || definition.name}${type === 'default' ? '' : ` (${type})`}`,
    file: sticker.name,
    position: sticker.anchor,
  })));

  for (const wallpaper of wallpapers) {
    const id = wallpaper.name
      .toLowerCase()
      .replace(/ +/g, '-')
      .replace(/[(:\.)]/g, '');
    
    await $(`cp ../assets/backgrounds/wallpapers/transparent/smol/${wallpaper.file} build/wallpapers/${wallpaper.file}`);
    
    await fs.writeFile(path.resolve(`build/wallpapers/${id}.conf`), `
      # Doki Theme Wallpaper: ${wallpaper.name}
      # Theme by: Unthrottled (https://github.com/Unthrottled)
      # Kitty build by: AroLeaf (https://github.com/AroLeaf)

      window_logo_path doki/wallpapers/${wallpaper.file}
      window_logo_position ${wallpaper.position}
      window_logo_alpha 1
    `.replace(/\n */g, '\n').slice(1));

    await fs.writeFile(path.resolve(`build/wallpapers/${id}-sticker-compat.conf`), `
      # Doki Theme Wallpaper: ${wallpaper.name} (sticker-compatible)
      # Theme by: Unthrottled (https://github.com/Unthrottled)
      # Kitty build by: AroLeaf (https://github.com/AroLeaf)

      background_image doki/wallpapers/${wallpaper.file}
      background_image_layout clamped
    `.replace(/\n */g, '\n').slice(1));
  }
}


async function buildStickers(definitions) {
  const stickers = definitions.flatMap(definition => Object.entries(definition.stickers).map(([type, sticker]) => ({
    name: `${definition.conflictName || definition.name}${type === 'default' ? '' : ` (${type})`}`,
    file: sticker.name,
  })));
  
  const stickerFiles = await fz.recursive(path.resolve('../assets/stickers/vscode'));

  for (const sticker of stickers) {
    const id = sticker.name
      .toLowerCase()
      .replace(/ +/g, '-')
      .replace(/[(:\.)]/g, '');

    await $(`cp ${stickerFiles.find(file => file.endsWith(sticker.file))} build/stickers/${sticker.file}`);
    
    await fs.writeFile(path.resolve(`build/stickers/${id}.conf`), `
      # Doki Theme Sticker: ${sticker.name}
      # Theme by: Unthrottled (https://github.com/Unthrottled)
      # Kitty build by: AroLeaf (https://github.com/AroLeaf)

      window_logo_path doki/stickers/${sticker.file}
      window_logo_position bottom-right
      window_logo_alpha 1
    `.replace(/\n */g, '\n').slice(1));
  }
}


async function main() {
  const definitions = await getDefinitions();
  await prepare();
  await buildThemes(definitions);
  await buildBackgrounds(definitions);
  await buildStickers(definitions);
}


main();