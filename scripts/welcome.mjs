#!/usr/bin/env node
/**
 * SessionStart hook — prints a ONE-TIME welcome/onboarding tip in the terminal so a
 * client knows exactly what to type, without reading a manual. Login-aware:
 *  - not logged in  → tell them to save their key first, then how to ask.
 *  - logged in      → "you're ready, just type /horizon-scanner:horizon <question>".
 *
 * Shows once per machine (sentinel in ~/.horizon-scanner/, the same dir horizon-login
 * writes config.json to — known writable). Fail-safe: NEVER throws / never blocks the
 * session. Cross-platform (Node, not bash) since clients run Windows + macOS.
 */
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

try {
  const dir = path.join(os.homedir(), '.horizon-scanner');
  const sentinel = path.join(dir, '.welcomed');
  if (fs.existsSync(sentinel)) process.exit(0); // already greeted — stay quiet

  const loggedIn = fs.existsSync(path.join(dir, 'config.json'));
  const lines = loggedIn
    ? [
        '',
        '  ✅ Horizon Scanner is ready.',
        '     Just type:  /horizon-scanner:horizon <your question>',
        '     e.g.        /horizon-scanner:horizon do cash transfers improve schooling in Latin America',
        '     (no quotes needed — type your question in plain English)',
        '',
      ]
    : [
        '',
        '  👋 Horizon Scanner installed. Two steps to your first paper:',
        '     1) Save your key:  /horizon-scanner:horizon-login <your hsk_ key>',
        '        (get it from the web app → account → "Set up Claude Code")',
        '     2) Then just ask:  /horizon-scanner:horizon <your question>   (no quotes)',
        '',
      ];
  console.log(lines.join('\n'));

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(sentinel, new Date().toISOString());
} catch {
  // never break the session over a welcome message
}
process.exit(0);
