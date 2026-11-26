'use strict';

/**
 * Initialize a project from this library.
 *
 *   node init.js greenfield <target>
 *   node init.js catchup <company-repo>
 *
 * Uses only Node.js built-ins. Messages are Traditional Chinese.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname);
const GREENFIELD_SRC = path.join(ROOT, 'ai-greenfield-starter');
const CATCHUP_SRC = path.join(ROOT, 'ai-company-catchup');
const EXCLUDE_MARKER = '# local AI catchup, do not commit';

function writeOut(message) {
  process.stdout.write(`${message}\n`);
}

function writeErr(message) {
  process.stderr.write(`${message}\n`);
}

function die(message, code) {
  writeErr(message);
  process.exit(code == null ? 1 : code);
}

function usage(code) {
  const text = [
    '用法：',
    '  node init.js greenfield <目標新專案路徑>',
    '  node init.js catchup <公司專案路徑>',
  ].join('\n');
  if (code === 0) {
    writeOut(text);
    process.exit(0);
  }
  die(text, code == null ? 1 : code);
}

function runGit(args, cwd, inherit) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) {
    if (result.error.code === 'ENOENT') die('找不到 git。請先安裝 Git 並加入 PATH。');
    die(`無法執行 git：${result.error.message}`);
  }
  return result;
}

function assertOutsideLibrary(dest) {
  const target = path.resolve(dest);
  const relative = path.relative(ROOT, target);
  const outside = relative.startsWith('..') || path.isAbsolute(relative);
  if (!outside) die(`目標不能是規範庫本身或其子目錄：${target}`);
  return target;
}

function isTracked(repo, relPath) {
  const result = runGit(['ls-files', '--error-unmatch', '--', relPath], repo, false);
  return result.status === 0;
}

function listSkillNames() {
  const skillsRoot = path.join(CATCHUP_SRC, '.agents', 'skills');
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function copyInto(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function excludeFile(repo) {
  const listed = runGit(['rev-parse', '--git-path', 'info/exclude'], repo, false);
  if (listed.status !== 0) {
    die(`找不到 Git 的 info/exclude：${(listed.stderr || '').trim()}`);
  }
  const printed = (listed.stdout || '').trim();
  return path.resolve(repo, printed);
}

function appendExclude(repo, rules) {
  const excludePath = excludeFile(repo);
  fs.mkdirSync(path.dirname(excludePath), { recursive: true });
  const raw = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf8') : '';
  const existing = new Set(
    raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
  );
  const pending = [];
  if (!existing.has(EXCLUDE_MARKER)) pending.push(EXCLUDE_MARKER);
  for (const rule of rules) {
    if (!existing.has(rule)) pending.push(rule);
  }
  if (pending.length === 0) {
    writeOut('.git/info/exclude 已有這些路徑，不重複寫入。');
    return;
  }
  let prefix = '';
  if (raw.length > 0) prefix = raw.endsWith('\n') ? '\n' : '\n\n';
  fs.appendFileSync(excludePath, `${prefix}${pending.join('\n')}\n`, 'utf8');
  writeOut(`.git/info/exclude 已加入 ${pending.length} 行。`);
}

function gitStatus(repo) {
  const result = runGit(['status', '--short'], repo, false);
  if (result.status !== 0) die(`git status 失敗：${(result.stderr || '').trim()}`);
  return result.stdout || '';
}

function normalizeStatusPath(line) {
  let text = line.slice(3).trim();
  if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
  const renamed = text.split(' -> ').pop();
  return renamed.replace(/\\/g, '/');
}

function matchesRule(statusPath, rule) {
  const norm = rule.replace(/^\//, '').replace(/\/$/, '');
  return statusPath === norm || statusPath.startsWith(`${norm}/`);
}

function assertImplantsHidden(statusText, rules) {
  const hits = [];
  for (const line of statusText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const statusPath = normalizeStatusPath(line);
    if (rules.some((rule) => matchesRule(statusPath, rule))) hits.push(line);
  }
  writeOut('git status --short:');
  writeOut(statusText.trim() ? statusText.trimEnd() : '（沒有輸出）');
  if (hits.length > 0) {
    die(`植入的檔案仍出現在 git status，工作區被污染：\n${hits.join('\n')}`);
  }
  writeOut('植入檔案沒有出現在 git status。');
}

function ensureCatchupRepo(repo) {
  if (!fs.existsSync(repo) || !fs.statSync(repo).isDirectory()) {
    die(`公司專案路徑不存在或不是目錄：${repo}`);
  }
  const probe = runGit(['rev-parse', '--is-inside-work-tree'], repo, false);
  if (probe.status !== 0) die('目標不是 Git 儲存庫。請在公司專案根目錄執行。');
}

function agentsFileIsTracked(repo) {
  const result = runGit(['ls-files', '--error-unmatch', '--', 'AGENTS.md'], repo, false);
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  die(`無法判斷 AGENTS.md 是否被追蹤：${(result.stderr || result.stdout || '').trim()}`);
  return false;
}

function buildLocalRule(sourceText) {
  const banner = [
    '公司既有 AGENTS.md 優先。兩者衝突時聽從公司檔。接手細則見 `docs/catchup/LOCAL_AGENTS.md`。',
    '本檔是本機紅線，不進公司 Git。',
    '',
  ].join('\n');
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(sourceText);
  if (!match) return `${banner}${sourceText}`;
  return `${sourceText.slice(0, match[0].length)}\n${banner}${sourceText.slice(match[0].length)}`;
}

function mergeSkills(repo, implanted) {
  for (const name of listSkillNames()) {
    const rel = `.agents/skills/${name}`;
    if (isTracked(repo, rel)) {
      writeOut(`略過已追蹤的 Skill，不覆蓋：${rel}/`);
      continue;
    }
    copyInto(
      path.join(CATCHUP_SRC, '.agents', 'skills', name),
      path.join(repo, '.agents', 'skills', name),
    );
    implanted.push(`/${rel}/`);
    writeOut(`已合併 Skill：${rel}/`);
  }
}

function writeLocalRule(repo, implanted) {
  const rel = '.cursor/rules/catchup-local.mdc';
  if (isTracked(repo, rel)) {
    writeOut(`略過已追蹤的規則，不覆蓋：${rel}`);
    return;
  }
  const source = fs.readFileSync(
    path.join(CATCHUP_SRC, '.cursor', 'rules', 'core-gate.mdc'),
    'utf8',
  );
  const dest = path.join(repo, '.cursor', 'rules', 'catchup-local.mdc');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buildLocalRule(source), 'utf8');
  implanted.push(`/${rel}`);
  writeOut(`已寫入 ${rel}`);
}

function commandGreenfield(destArg) {
  const dest = assertOutsideLibrary(destArg);
  if (fs.existsSync(dest)) {
    const stat = fs.statSync(dest);
    if (!stat.isDirectory()) die(`目標已存在且不是目錄：${dest}`);
    if (fs.readdirSync(dest).length > 0) {
      die(`目標目錄不是空的，為避免覆蓋而停止：${dest}`);
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
  }

  fs.cpSync(GREENFIELD_SRC, dest, { recursive: true });
  writeOut(`已複製 ai-greenfield-starter 到 ${dest}`);

  const git = runGit(['init', '-b', 'main'], dest, true);
  if (git.status !== 0) die('git init -b main 失敗。', git.status || 1);

  const check = spawnSync(process.execPath, ['scripts/check-refs.js'], {
    cwd: dest,
    windowsHide: true,
    stdio: 'inherit',
  });
  if (check.error) die(`無法執行 check-refs.js：${check.error.message}`);
  if (check.status !== 0) die('專案已建立，但 #REF 檢查失敗。', check.status || 1);
  writeOut('greenfield 初始化完成。');
}

function commandCatchup(destArg) {
  const repo = assertOutsideLibrary(destArg);
  ensureCatchupRepo(repo);
  const tracked = agentsFileIsTracked(repo);
  const implanted = ['/docs/catchup/'];
  fs.mkdirSync(path.join(repo, 'docs', 'catchup'), { recursive: true });

  if (!tracked) {
    writeOut('模式：直接植入（AGENTS.md 未被 Git 追蹤）');
    copyInto(path.join(CATCHUP_SRC, 'AGENTS.md'), path.join(repo, 'AGENTS.md'));
    implanted.push('/AGENTS.md');
    writeOut('已寫入 AGENTS.md');

    if (isTracked(repo, '.agents')) {
      writeOut('.agents 已有被追蹤的檔案，改為只合併尚未追蹤的 Skill。');
      mergeSkills(repo, implanted);
    } else {
      copyInto(path.join(CATCHUP_SRC, '.agents'), path.join(repo, '.agents'));
      implanted.push('/.agents/');
      writeOut('已寫入 .agents/');
    }

    const ruleRel = '.cursor/rules/core-gate.mdc';
    if (isTracked(repo, ruleRel)) {
      writeOut(`略過已追蹤的規則，不覆蓋：${ruleRel}`);
    } else {
      copyInto(
        path.join(CATCHUP_SRC, '.cursor', 'rules', 'core-gate.mdc'),
        path.join(repo, '.cursor', 'rules', 'core-gate.mdc'),
      );
      implanted.push(`/${ruleRel}`);
      writeOut(`已寫入 ${ruleRel}`);
    }
  } else {
    writeOut('模式：安全合併（公司已追蹤 AGENTS.md，不覆蓋）');
    copyInto(
      path.join(CATCHUP_SRC, 'AGENTS.md'),
      path.join(repo, 'docs', 'catchup', 'LOCAL_AGENTS.md'),
    );
    writeOut('已寫入 docs/catchup/LOCAL_AGENTS.md');
    mergeSkills(repo, implanted);
    writeLocalRule(repo, implanted);
    const diff = runGit(['diff', '--', 'AGENTS.md'], repo, false);
    if ((diff.stdout || '').trim()) die('公司的 AGENTS.md 被改動，已中止。請還原該檔。');
  }

  appendExclude(repo, implanted);
  assertImplantsHidden(gitStatus(repo), implanted);
  writeOut('catchup 初始化完成。');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && (args[0] === '-h' || args[0] === '--help')) usage(0);
  if (args.length !== 2) usage(1);
  if (!fs.existsSync(GREENFIELD_SRC) || !fs.existsSync(CATCHUP_SRC)) {
    die('請在 ai-dev-libraries 根目錄執行。找不到兩套規範目錄。');
  }
  if (args[0] === 'greenfield') commandGreenfield(args[1]);
  else if (args[0] === 'catchup') commandCatchup(args[1]);
  else usage(1);
}

main();
