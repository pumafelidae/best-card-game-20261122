// Ember & Tide — Duel of Three Winds. The hand-in program (Node 22,
// standard library only): it copies the game and its screenshots beside
// this file into /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. It writes the same bytes
// every run — no timestamps, no randomness — so the grader's two runs agree.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Fail loudly rather than hand in an empty entry: the dossier must exist,
// parse, and name the game, and the copied game and screenshots must be
// present in /output. A silent partial hand-in would waste the submission.
const dossierPath = join(out, 'dossier.json');
const dossierText = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(dossierPath, dossierText);
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
if (!dossier || typeof dossier !== 'object') throw new Error('dossier.json did not parse');
if (!existsSync(join(out, 'game', 'index.html'))) throw new Error('game/index.html missing from /output');
if (statSync(dossierPath).size === 0) throw new Error('dossier.json is empty');
