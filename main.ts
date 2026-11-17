import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const limits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(out, { recursive: true });
for (const name of ['game', 'screenshots', 'dossier.json']) {
  rmSync(join(out, name), { recursive: true, force: true });
}
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8')) as Array<{ name: string }>;
  for (const shot of shots) cpSync(join(here, 'screenshots', shot.name), join(out, 'screenshots', shot.name));
}

const dossier = buildDossier(out, limits);
writeFileSync(join(out, 'dossier.json'), dossier);
