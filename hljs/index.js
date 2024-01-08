const { getDefinitions } = require('../shared');
const fs = require('node:fs/promises');
const path = require('node:path');
const $ = require('node:util').promisify(require('node:child_process').exec);


async function prepare() {
  await $(`
    rm -rf build
    mkdir -p build
  `);
}


async function getThemes(definitions) {
  const themes = definitions.map(theme => ({
    id: theme.id,
    name: theme.conflictName || theme.name,
    config: /* css */`
      .hljs {
        display: block;
        overflow-x: auto;
        padding: 0.5em;
        background-color: ${theme.colors.baseBackground};
        color: ${theme.colors.foregroundColor};
      }

      .hljs-keyword,
      .hljs-literal
      .hljs-variable.language_ {
        color: ${theme.colors.keywordColor};
      }

      .hljs-type,
      .hljs-section,
      .hljs-title.function_,
      .hljs-selector-pseudo {
        color: ${theme.colors.keyColor};
      }

      .hljs-number,
      .hljs-symbol {
        color: ${theme.colors.constantColor};
      }

      .hljs-operator,
      .hljs-name,
      .hljs-selector-tag {
        color: ${theme.colors.htmlTagColor};
      }

      .hljs-punctuation,
      .hljs-property,
      .hljs-variable,
      .hljs-tag,
      .hljs-template-tag,
      .hljs-template-variable {
        color: ${theme.colors.foregroundColorEditor};
        font-weight: bold;
      }

      .hljs-regexp,
      .hljs-string,
      .hljs-char.escape_,
      .hljs-params {
        color: ${theme.colors.stringColor};
      }

      .hljs-variable.constant_,
      .hljs-title.class_ {
        color: ${theme.colors.classNameColor};
      }

      .hljs-title.function_.invoke__,
      .hlsj-attr,
      .hljs-attribute,
      .hljs-bullet,
      .hljs-link {
        color: ${theme.colors.editorAccentColor};
      }

      .hljs-comments,
      .hljs-quote {
        color: ${theme.colors.comments};
        font-style: italic;
      }

      .hljs-code,
      .hljs-strong {
        font-weight: bold;
      }

      .hljs-emphasis {
        font-style: italic;
      }

      .hljs-selector-id,
      .hljs-selector-class,
      .hljs-selector-attr {
        color: ${theme.colors.editorAccentColor};
        font-style: italic; 
      }

      .hljs-addition {
        background-color: ${theme.colors['diff.inserted']};
      }
      
      .hljs-deletion {
        background-color: ${theme.colors['diff.deleted']};
      }
    `.replace(/\n */g, '\n').slice(1),
  }));

  return themes;
}


async function saveThemes(themes) {
  for (const theme of themes) {
    await fs.writeFile(path.resolve(`build/${theme.id}.css`), theme.config, 'utf8');
  }
}


async function main() {
  const definitions = await getDefinitions();
  await prepare();
  const themes = await getThemes(definitions);
  await saveThemes(themes);
}


if (require.main === module) {
  main();
}

module.exports = {
  getThemes,
};