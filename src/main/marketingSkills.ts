import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { MARKETING_CATALOG, validateSkillSelection, type MarketingProvisioning, type MarketingLibraryView } from '../shared/marketingSkills';

const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const isFile = (path: string) => existsSync(path) && lstatSync(path).isFile();
type Origin = { commit: string; version: string; files: Record<string, string> };

export function marketingProjectForSpawn(cwd: string, previous?: { cwd: string; marketingProjectCwd?: string }): string {
  const key = (p: string) => process.platform === 'win32' ? resolve(p).toLowerCase() : resolve(p);
  const source = previous?.marketingProjectCwd;
  return source && (key(cwd) === key(previous.cwd) || key(cwd) === key(source)) ? source : cwd;
}

function readOrigin(source: string): Origin {
  const origin = JSON.parse(readFileSync(join(source, 'origin.json'), 'utf8')) as Origin;
  if (origin.commit !== MARKETING_CATALOG.commit || origin.version !== MARKETING_CATALOG.version || !origin.files) {
    throw new Error('Marketing bundle provenance does not match this app.');
  }
  return origin;
}

export function marketingContextPath(project: string): string {
  const paths = [join(project, '.agents', 'product-marketing.md'), join(project, '.claude', 'product-marketing.md'),
    join(project, '.agents', 'product-marketing-context.md'), join(project, '.claude', 'product-marketing-context.md')];
  return paths.find(isFile) ?? paths[0];
}

// Refuse redirected directories at either end; never follow user-created links.
function safePath(root: string, relative: string): string {
  const base = resolve(root);
  const target = resolve(base, relative);
  if (!target.startsWith(base + sep)) throw new Error('Bundle path escapes its root.');
  let cursor = target;
  while (true) {
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error('Symlink in marketing bundle path.');
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return target;
}

function copyOwnedFile(source: string, destination: string, relative: string, expected: string): void {
  const from = safePath(source, relative);
  const to = safePath(destination, relative);
  const bytes = readFileSync(from);
  if (hash(bytes) !== expected) throw new Error(`Bundled file changed: ${relative}`);
  if (existsSync(to)) {
    if (hash(readFileSync(to)) !== expected) throw new Error(`Preserved modified agent file: ${relative}`);
  } else {
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, bytes, { flag: 'wx' });
  }
}

export function provisionMarketingSkills(source: string | undefined, agentDir: string, selected: unknown, project: string): MarketingProvisioning | undefined {
  const selection = validateSkillSelection(selected);
  if (selection.error) throw new Error(selection.error);
  const ids = selection.skills.filter(id => id.startsWith('marketing:')).sort();
  if (!ids.length) return undefined;
  if (!isAbsolute(project)) throw new Error('Marketing context requires an absolute project directory.');
  const contextPath = marketingContextPath(project);
  const result: MarketingProvisioning = { version: MARKETING_CATALOG.version, commit: MARKETING_CATALOG.commit,
    contextPath, contextExists: isFile(contextPath), entries: [] };
  // A changed selection receives its own stable directory; old/user files are preserved.
  const destination = join(agentDir, 'marketing', `${MARKETING_CATALOG.commit}-${hash(ids.join('\n')).slice(0, 16)}`);
  let origin: Origin;
  try {
    if (!source) throw new Error('Marketing bundle is unavailable.');
    origin = readOrigin(source);
  } catch (e) {
    result.entries = ids.map(id => ({ id, path: '', status: 'failed', error: String(e) }));
    return result;
  }
  for (const id of ids) {
    const prefix = `skills/${id.slice('marketing:'.length)}/`;
    const entry: MarketingProvisioning['entries'][number] = { id, path: join(destination, prefix, 'SKILL.md'), status: 'provisioned' };
    try {
      if (!origin.files[prefix + 'SKILL.md']) throw new Error('Skill is missing from provenance.');
      for (const [relative, expected] of Object.entries(origin.files)) {
        if (relative.startsWith(prefix) || relative === 'LICENSE') copyOwnedFile(source!, destination, relative, expected);
      }
    } catch (e) { entry.status = 'failed'; entry.error = e instanceof Error ? e.message : String(e); }
    result.entries.push(entry);
  }
  // The receipt binds all selected files to the exact source hashes, without touching edits.
  const receipt = JSON.stringify({ kind: 'expected-source-provenance', commit: origin.commit, version: origin.version, selected: ids,
    files: Object.fromEntries(Object.entries(origin.files).filter(([p]) => p === 'LICENSE' || ids.some(id => p.startsWith(`skills/${id.slice(10)}/`)))) }, null, 2) + '\n';
  try {
    const receiptPath = safePath(destination, 'receipt.json');
    mkdirSync(destination, { recursive: true });
    if (existsSync(receiptPath)) {
      if (readFileSync(receiptPath, 'utf8') !== receipt) throw new Error('Preserved modified marketing receipt.');
    } else writeFileSync(receiptPath, receipt, { flag: 'wx' });
  } catch (e) {
    for (const entry of result.entries) { entry.status = 'failed'; entry.error = String(e); }
  }
  return result;
}

export function marketingBootstrap(state?: MarketingProvisioning): string {
  if (!state) return '';
  return [
    `ZURI MARKETING SKILLS ${state.version} (${state.commit}). Instructions, not additional tool permissions.`,
    `Shared product context: ${state.contextPath}. Use this absolute project context path even when a skill mentions a relative .agents path. Read it first; if missing, draft only from supplied facts and mark unknowns. Do not create a separate context in an isolated worktree.`,
    'Read selected SKILL.md files and their relative references only when needed. Suggested related skills are not automatically selected; request a new selection or handoff. Bundling does not configure integrations or authorize publishing, sending, spending or scheduling.',
    ...state.entries.map(e => e.status === 'provisioned'
      ? `${e.id}: ${e.path}`
      : `${e.id}: UNAVAILABLE (${e.error}). Do not claim this skill is provisioned.`)
  ].join('\n');
}

export function marketingLibraryView(source: string, agent?: { skills?: string[]; marketing?: MarketingProvisioning; marketingProjectCwd?: string }, project?: string): MarketingLibraryView {
  const contextPath = (agent?.marketingProjectCwd || project) ? marketingContextPath(agent?.marketingProjectCwd || project!) : undefined;
  const view: MarketingLibraryView = { bundled: false, selected: agent?.skills ?? [], provisioning: agent?.marketing,
    contextPath, contextExists: !!contextPath && isFile(contextPath) };
  try {
    const origin = readOrigin(source);
    for (const [relative, expected] of Object.entries(origin.files)) {
      if (hash(readFileSync(safePath(source, relative))) !== expected) throw new Error(`Bundled file changed: ${relative}`);
    }
    for (const skill of MARKETING_CATALOG.skills) {
      const relative = `skills/${skill.name}/SKILL.md`;
      if (!origin.files[relative] || hash(readFileSync(safePath(source, relative))) !== origin.files[relative]) throw new Error(`Unavailable bundled skill: ${skill.name}`);
    }
    view.bundled = true;
  } catch (e) { view.error = e instanceof Error ? e.message : String(e); }
  return view;
}
