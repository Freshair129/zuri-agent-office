'use strict';
// Explicit local acceptance run. Requires Playwright and an already-running local model server.
const { _electron } = require(process.env.ZURI_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const run = path.join(root, 'output/playwright/fresh-' + Date.now());
const profile = path.join(run, 'profile');
const hive = path.join(run, 'hive');
fs.mkdirSync(path.join(profile, 'temp'), {recursive:true});
const env = {...process.env, ZURI_USER_DATA_DIR:profile, TEMP:path.join(profile,'temp'), TMP:path.join(profile,'temp')};
delete env.ELECTRON_RUN_AS_NODE;
for (const key of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY/.test(key)) delete env[key];
const endpoint = process.env.ZURI_QA_ENDPOINT || 'http://127.0.0.1:11435/v1';
const model = process.env.ZURI_QA_MODEL || 'qwen3.5:4b';
(async()=>{
 const app = await _electron.launch({executablePath:path.join(root,'dist/win-unpacked/Zuri.exe'),env,timeout:60000});
 const page = await app.firstWindow();
 page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.getByRole('button',{name:/I'M TECHNICAL/}).click();
  await page.getByRole('button',{name:'next',exact:true}).click();
  await page.getByRole('button',{name:'set it up',exact:true}).click();
  await page.getByRole('textbox').fill(hive);
  await page.getByRole('button',{name:'next',exact:true}).click();
  await page.locator('input[value=opencode]').check();
  await page.getByLabel('Local base URL',{exact:true}).fill(endpoint);
  await page.getByLabel('Local model ID',{exact:true}).fill(model);
  await page.screenshot({path:path.join(run,'onboarding-local.png')});
  await page.getByRole('button',{name:'next',exact:true}).click();
  await page.getByRole('button',{name:'next',exact:true}).click();
  await page.getByRole('checkbox').first().uncheck();
  await page.getByRole('button',{name:'finish',exact:true}).click();
  await page.getByRole('button',{name:/add agent/i}).waitFor({timeout:60000});
  const config=JSON.parse(fs.readFileSync(path.join(profile,'config.json'),'utf8'));
  assert.equal(config.godProvider,'opencode');assert.equal(config.godModel,'local/'+model);
  assert.equal(config.providerBaseUrls.opencode,endpoint);assert.equal(config.providerDefaultModels.opencode,model);
  assert.equal(config.telemetryEnabled,false);assert.equal(config.autoUpdate,false);
  await page.waitForFunction(()=>document.querySelector('canvas')!==null);
  await page.screenshot({path:path.join(run,'packaged-office.png')});
  const identity=await app.evaluate(({app})=>({name:app.getName(),version:app.getVersion(),packaged:app.isPackaged,userData:app.getPath('userData')}));
  assert.equal(identity.packaged,true);assert.equal(identity.name,'Zuri');assert.equal(identity.userData,profile);
  assert.deepEqual(errors,[]);
  const result={status:'Passed',scope:'Packaged fresh onboarding and local config persistence; no claim of live task completion',identity,endpoint,model,errors,run};
  fs.writeFileSync(path.join(run,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 } finally {
  await page.evaluate(async()=>{for(const p of await window.cth.listPtys()) await window.cth.killPty(p.id)}).catch(()=>{});
  await app.close();
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
