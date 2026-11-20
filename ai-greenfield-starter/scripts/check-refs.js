'use strict';

/**
 * Scan docs/ and src/ for `#REF: [relative-path#anchor]` and exit 1 on broken links.
 *
 * Resolution base: the directory of the file that contains the reference.
 * Markdown anchors must match an ATX heading's explicit `{#id}` or its slug.
 * Non-markdown targets only need to exist. Absolute paths and paths that leave
 * the repository root are broken links.
 *
 * Usage: node scripts/check-refs.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['docs', 'src'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'vendor']);
const REF_RE = /#REF:\s*\[([^\]\n]+)\]/g;

function writeOut(message) {
  process.stdout.write(`${message}\n`);
}

function writeErr(message) {
  process.stderr.write(`${message}\n`);
}

function walk(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name) || entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile()) acc.push(full);
  }
  return acc;
}

function readText(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.includes(0)) return null;
  let text = buffer.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return text;
}

function slugify(text) {
  const plain = text
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '');
  return plain
    .toLowerCase()
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~，。、；：（）【】「」『』]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function collectAnchors(markdown) {
  const anchors = new Set();
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    let title = match[2].trim();
    for (const id of title.matchAll(/\{#([^}\s]+)\}/g)) {
      anchors.add(id[1].toLowerCase());
    }
    title = title.replace(/\s*\{#[^}\s]+\}\s*/g, ' ').trim();
    const slug = slugify(title);
    if (slug) anchors.add(slug);
  }
  return anchors;
}

function splitTarget(raw) {
  const trimmed = raw.trim();
  const hash = trimmed.indexOf('#');
  if (hash === -1) return { file: trimmed, anchor: '' };
  const file = trimmed.slice(0, hash).trim();
  let anchor = trimmed.slice(hash + 1).trim();
  try {
    anchor = decodeURIComponent(anchor);
  } catch (error) {
    return { error: `錨點編碼無效：${anchor}` };
  }
  return { file, anchor };
}

function resolveInsideRepo(fromFile, filePart) {
  if (filePart && (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(filePart) || filePart.startsWith('\\'))) {
    return { error: '禁止使用絕對路徑或 URL' };
  }
  const target = filePart === '' ? fromFile : path.resolve(path.dirname(fromFile), filePart);
  const relative = path.relative(ROOT, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { error: '路徑超出儲存庫根目錄' };
  }
  if (relative === '') return { error: '引用指向儲存庫根目錄而不是檔案' };
  return { target };
}

function locateExact(targetPath) {
  const parts = path.relative(ROOT, targetPath).split(path.sep).filter(Boolean);
  let current = ROOT;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch (error) {
      return { error: `無法讀取目錄 ${path.relative(ROOT, current) || '.'}` };
    }
    const exact = entries.find((name) => name === part);
    if (!exact) {
      const folded = entries.find((name) => name.toLowerCase() === part.toLowerCase());
      if (folded) return { error: `檔名大小寫不一致：寫了 ${part}，實際是 ${folded}` };
      return { error: '目標檔案不存在' };
    }
    current = path.join(current, exact);
    let stat;
    try {
      stat = fs.statSync(current);
    } catch (error) {
      return { error: '目標檔案不存在' };
    }
    const isLast = i === parts.length - 1;
    if (isLast && !stat.isFile()) return { error: '目標存在但不是檔案' };
    if (!isLast && !stat.isDirectory()) return { error: '路徑中間經過檔案' };
  }
  return { file: current };
}

function checkAnchor(filePath, anchor) {
  if (!anchor) return null;
  const extension = path.extname(filePath).toLowerCase();
  if (extension !== '.md' && extension !== '.markdown') return null;
  const text = readText(filePath);
  if (text == null) return '目標不是 UTF-8 文字，無法檢查章節錨點';
  const anchors = collectAnchors(text);
  if (!anchors.has(anchor.toLowerCase())) return `找不到章節錨點 #${anchor}`;
  return null;
}

function collectRefs(filePath) {
  const text = readText(filePath);
  if (text == null) return { skipped: true, refs: [] };
  const refs = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const re = new RegExp(REF_RE.source, 'g');
    for (const match of lines[i].matchAll(re)) {
      refs.push({ line: i + 1, raw: match[1] });
    }
  }
  return { skipped: false, refs };
}

function main() {
  const problems = [];
  let fileCount = 0;
  let refCount = 0;

  for (const dirName of SCAN_DIRS) {
    const dir = path.join(ROOT, dirName);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      problems.push(`找不到掃描目錄 ${dirName}/`);
      continue;
    }
    for (const file of walk(dir, [])) {
      fileCount += 1;
      const relativeFile = path.relative(ROOT, file);
      let collected;
      try {
        collected = collectRefs(file);
      } catch (error) {
        problems.push(`${relativeFile}: 無法讀取檔案`);
        continue;
      }
      if (collected.skipped) {
        writeErr(`警告：略過非 UTF-8 文字檔 ${relativeFile}`);
        continue;
      }
      for (const ref of collected.refs) {
        refCount += 1;
        const where = `${relativeFile}:${ref.line}`;
        const parts = splitTarget(ref.raw);
        if (parts.error) {
          problems.push(`${where}: ${parts.error} [${ref.raw}]`);
          continue;
        }
        const resolved = resolveInsideRepo(file, parts.file);
        if (resolved.error) {
          problems.push(`${where}: ${resolved.error} [${ref.raw}]`);
          continue;
        }
        const located = locateExact(resolved.target);
        if (located.error) {
          problems.push(`${where}: ${located.error} [${ref.raw}]`);
          continue;
        }
        const anchorError = checkAnchor(located.file, parts.anchor);
        if (anchorError) problems.push(`${where}: ${anchorError} [${ref.raw}]`);
      }
    }
  }

  if (problems.length > 0) {
    writeErr(`#REF 檢查失敗：${problems.length} 個問題。`);
    for (const problem of problems) writeErr(`- ${problem}`);
    process.exit(1);
  }

  writeOut(`#REF 檢查通過：掃描 ${fileCount} 個檔案，驗證 ${refCount} 條連結。`);
  process.exit(0);
}

main();
