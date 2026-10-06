// This must be the first import of the main entrypoint, before state consumers.
import { app } from 'electron';
import { mkdirSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

const override = process.env.ZURI_USER_DATA_DIR;
if (override !== undefined && !isAbsolute(override)) {
  throw new Error('ZURI_USER_DATA_DIR must be an absolute directory path');
}

app.setName('Zuri');
app.setAppUserModelId('ai.zuri.agentoffice');
const root = override ? resolve(override) : join(app.getPath('appData'), 'ZuriAgentOffice');
const paths = {
  userData: root,
  sessionData: join(root, 'session'),
  logs: join(root, 'logs'),
  temp: join(root, 'temp'),
  crashDumps: join(root, 'crashDumps')
};
for (const [name, path] of Object.entries(paths)) {
  mkdirSync(path, { recursive: true });
  app.setPath(name, path);
}
const cache = join(root, 'cache');
mkdirSync(cache, { recursive: true });
app.commandLine.appendSwitch('disk-cache-dir', cache);
