const fz = require('file-ez');
const path = require('node:path');

const templates = {
  base: require('../theme/templates/base.colors.template.json'),
  dark: require('../theme/templates/dark.colors.template.json'),
  light: require('../theme/templates/light.colors.template.json'),
}

function getColors(theme) {
  const defaultAnsiColors = {
    'terminal.ansiBlack': '#000000',
    'terminal.ansiRed': '#C51E14',
    'terminal.ansiGreen': '#1DC121',
    'terminal.ansiYellow': '#C7C329',
    'terminal.ansiBlue': '#0A2FC4',
    'terminal.ansiMagenta': '#C839C5',
    'terminal.ansiCyan': '#20C5C6',
    'terminal.ansiWhite': '#C7C7C7',
    'terminal.ansiLightBlack': '#686868',
    'terminal.ansiLightRed': '#FD6F6B',
    'terminal.ansiLightGreen': '#67F86F',
    'terminal.ansiLightYellow': '#FFFA72',
    'terminal.ansiLightBlue': '#6A76FB',
    'terminal.ansiLightMagenta': '#FD7CFC',
    'terminal.ansiLightCyan': '#68FDFE',
    'terminal.ansiLightWhite': '#FFFFFF',
  }

  return {
    ...defaultAnsiColors,
    ...templates.base.colors,
    ...(theme.dark ? templates.dark : templates.light).colors,
    ...theme.colors,
    ...theme.overrides?.editorScheme?.colors 
      ? Object.fromEntries(Object.entries(theme.overrides.editorScheme.colors).map(([key, value]) => [
        `editor${key[0].toUpperCase()}${key.slice(1)}`,
        value,
      ])) 
      : {},
  }
}

function getId(name) {
  return name
    .toLowerCase()
    .replace(/ +/g, '-')
    .replace(/[(:\.)]/g, '');
}

async function getDefinitions() {
  const files = await fz.recursive(path.resolve(__dirname, '../theme/definitions'));
  return files.map(file => require(file)).map(definition => ({
    ...definition,
    id: getId(definition.conflictName || definition.name),
    colors: getColors(definition),
  }));
}

module.exports = {
  getColors,
  getDefinitions,
}