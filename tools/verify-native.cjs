'use strict';
// Run inside Electron: electron tools/verify-native.cjs. No user data is read.
const { app } = require('electron');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const pty = require('node-pty');
app.whenReady().then(() => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE proof (value TEXT)');
  db.prepare('INSERT INTO proof VALUES (?)').run('ZURI_SQLITE_OK');
  assert.equal(db.prepare('SELECT value FROM proof').get().value, 'ZURI_SQLITE_OK');
  db.close();
  const terminal = pty.spawn('cmd.exe', ['/d', '/c', 'echo ZURI_PTY_OK'], { cols: 80, rows: 24, cwd: __dirname, env: { ...process.env } });
  let output = '';
  terminal.onData(data => { output += data; });
  const timeout = setTimeout(() => { terminal.kill(); app.exit(1); }, 10000);
  terminal.onExit(({exitCode}) => {
    clearTimeout(timeout);
    assert.equal(exitCode, 0);
    assert.match(output, /ZURI_PTY_OK/);
    console.log(JSON.stringify({sqlite:'Passed',pty:'Passed',electron:process.versions.electron,abi:process.versions.modules}));
    app.exit(0);
  });
}).catch(error => { console.error(error.message); app.exit(1); });
