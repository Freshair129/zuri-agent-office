'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** Evaluate one main module with explicit Electron/network dependency boundaries. */
module.exports = function loadIsolated(relative, dependencies, env = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const mod = { exports: {} };
  const requireBoundary = (name) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency ${name}`);
  };
  new Function('module', 'exports', 'require', 'process', code)(mod, mod.exports, requireBoundary,
    { env, platform: process.platform, arch: process.arch });
  return mod.exports;
};
