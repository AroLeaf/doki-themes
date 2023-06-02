const { getColors, getDefinitions } = require('../shared');
const fs = require('node:fs/promises');
const path = require('node:path');
const $ = require('node:util').promisify(require('node:child_process').exec);


async function prepare() {
  await $(`
    rm -rf build
    mkdir -p build
  `);
}


async function buildThemes(definitions) {
  const alphaColor = hex => {
    const part = idx => parseInt(hex.slice(idx*2 + 1, idx*2 + 3), 16);
    return `rgba(${part(0)}, ${part(1)}, ${part(2)}, ${(part(3)/256).toFixed(2)})`;
  }

  const themes = definitions.map(theme => ({
    id: theme.id,
    name: theme.conflictName || theme.name,
    config: `
      -- Doki Theme: ${theme.name}
      -- Theme by: Unthrottled (https://github.com/Unthrottled)
      -- Kitty build by: AroLeaf (https://github.com/AroLeaf)

      local style = require "core.style"
      local common = require "core.common"

      style.background = { common.color "${theme.colors.baseBackground}" }
      style.background2 = { common.color "${theme.colors.secondaryBackground}" }
      style.background3 = { common.color "${theme.colors.completionWindowBackground || theme.colors.baseBackground}" }
      style.text = { common.color "${theme.colors.foregroundColor}" }
      style.caret = { common.color "${theme.colors.accentColor}" }
      style.accent = { common.color "${theme.colors.accentColor}" }
      style.dim = { common.color "${alphaColor(theme.colors.accentColorTransparent)}" }
      style.divider = { common.color "${theme.colors.baseBackground}" }
      style.selection = { common.color "${theme.colors.selectionBackground}" }
      style.line_number = { common.color "${theme.colors.lineNumberColor}" }
      style.line_number2 = { common.color "${theme.colors.lineNumberColor}" }
      style.line_highlight = { common.color "${theme.colors.caretRow}" }
      style.scrollbar = { common.color "${alphaColor(theme.colors.accentColor + '5F')}" }
      style.scrollbar2 = { common.color "${alphaColor(theme.colors.accentColor + '3F')}" }

      style.syntax["normal"] = { common.color "${theme.colors.foregroundColorEditor}" }
      style.syntax["symbol"] = { common.color "${theme.colors.foregroundColorEditor}" }
      style.syntax["comment"] = { common.color "${theme.colors.comments}" }
      style.syntax["keyword"] = { common.color "${theme.colors.keywordColor}" }
      style.syntax["keyword2"] = { common.color "${theme.colors.keyColor}" }
      style.syntax["number"] = { common.color "${theme.colors.constantColor}" }
      style.syntax["literal"] = { common.color "${theme.colors.constantColor}" }
      style.syntax["string"] = { common.color "${theme.colors.stringColor}" }
      style.syntax["operator"] = { common.color "${theme.colors.keywordColor}" }
      style.syntax["function"] = { common.color "${theme.colors.classNameColor}" }

      style.syntax["paren1"] = { common.color "${theme.colors.foregroundColorEditor}" }
      style.syntax["paren2"] = { common.color "${theme.colors.keyColor}" }
      style.syntax["paren3"] = { common.color "${theme.colors.classNameColor}" }
      style.syntax["paren4"] = { common.color "${theme.colors.editorAccentColor || theme.colors.accentColor}" }
      style.syntax["paren5"] = { common.color "${theme.colors.keyColor}" }
      style.syntax["paren_unbalanced"] = { common.color "${theme.colors.errorColor}" }

      style.gitdiff_addition = { common.color "${theme.colors['diff.deleted']}" }
      style.gitdiff_modification = { common.color "${theme.colors['diff.modified']}" }
      style.gitdiff_deletion = { common.color "${theme.colors['diff.deleted']}" }
    `.replace(/\n */g, '\n').slice(1),
  }));

  for (const theme of themes) {
    await fs.writeFile(path.resolve(`build/${theme.id}.lua`), theme.config, 'utf8');
  }
}


async function main() {
  const definitions = await getDefinitions();
  await prepare();
  await buildThemes(definitions);
}


main();