#!/usr/bin/env node

/**
 * validate-pipeline.mjs — Pipeline integrity checker.
 *
 * Runs 7 deterministic checks on the project's skill/agent/rule/docs files.
 * Zero dependencies. Node.js 18+.
 *
 * Usage: node scripts/validate-pipeline.mjs [--root <path>]
 * Exit:  0 if no ERRORs, 1 if any ERROR found.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── helpers ──────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = (() => {
  const i = process.argv.indexOf('--root');
  return i >= 0 ? path.resolve(process.argv[i + 1]) : path.resolve(__dirname, '..');
})();

/** @param {string} p absolute path */
function exists(p) { try { fs.accessSync(p, fs.constants.F_OK); return true; } catch { return false; } }

/** @param {string} p absolute path */
function readFile(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }

/** Recursively collect files with optional regex filter */
function walkFiles(dir, filter) {
  const abs = path.resolve(ROOT, dir);
  if (!exists(abs)) return [];
  const results = [];
  const stack = [abs];
  const skip = new Set(['node_modules', '.git', 'build', 'dist', 'target', '__pycache__', '.venv', 'vendor']);
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.claude' && e.name !== '.agents' && e.name !== '.gitignore' && e.name !== '.github') continue;
      if (skip.has(e.name)) continue;
      const fp = path.join(d, e.name);
      const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
      if (e.isDirectory()) { stack.push(fp); continue; }
      if (!filter || filter.test(rel)) results.push(rel);
    }
  }
  return results;
}

/** Parse simple YAML frontmatter (key: value + `- item` arrays only) */
function parseFrontmatter(text, filePath) {
  const lines = text.split(/\r?\n/);
  let start = -1, end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (start === -1) { start = i; } else { end = i; break; }
    }
  }
  if (start === -1) return { body: text, fm: null, error: 'no opening ---' };
  if (end === -1) return { body: text, fm: null, error: 'no closing ---' };

  const fmLines = lines.slice(start + 1, end);
  const fm = {};
  const arrays = new Map(); // key -> string[]
  let currentArray = null;

  for (const raw of fmLines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const arrMatch = line.match(/^\s*-\s+(.+)$/);
    if (arrMatch) {
      if (currentArray) arrays.get(currentArray).push(arrMatch[1].trim());
      continue;
    }

    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentArray = null;
      const key = kvMatch[1];
      let val = kvMatch[2].trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      // Detect list start indicator: a key followed by nothing means next `- ` lines belong to it
      if (val === '') { currentArray = key; arrays.set(key, []); continue; }
      fm[key] = val;
      currentArray = null;
    }
  }

  // Merge arrays into fm, stripping quotes from list items
  for (const [k, v] of arrays) {
    if (v.length > 0) {
      fm[k] = v.map(item => {
        if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
          return item.slice(1, -1);
        }
        return item;
      });
    }
  }

  return { body: lines.slice(end + 1).join('\n'), fm, error: null };
}

function makeRegex(pattern) {
  let r = pattern.replace(/\\/g, '/');
  // Brace expansion {a,b,c}
  r = r.replace(/\{([^}]+)\}/g, (_, g) => `(${g.split(',').map(s => s.trim()).join('|')})`);
  // Handle glob wildcards BEFORE escaping — placeholders
  r = r.replace(/\*\*/g, '\x00GLOBSTAR\x00');
  r = r.replace(/\*/g, '\x00GLOBSINGLE\x00');
  // Escape all regex specials
  r = r.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // Restore placeholders
  r = r.replace(/\x00GLOBSTAR\x00/g, '.*');
  r = r.replace(/\x00GLOBSINGLE\x00/g, '[^/]*');
  return new RegExp('^' + r + '$', 'i');
}

/** Collect all files matching a list of glob patterns */
function matchGlobs(patterns) {
  if (!patterns || patterns.length === 0) return [];
  const regexes = patterns.map(makeRegex);
  const allFiles = walkFiles('.', null);
  return allFiles.filter(f => regexes.some(r => r.test(f)));
}

// ── collectors ───────────────────────────────────────────────────────

function collectSkillFiles() {
  const result = [];
  for (const dir of ['.claude/skills', '.agents/skills']) {
    const abs = path.resolve(ROOT, dir);
    if (!exists(abs)) continue;
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const sf = path.join(abs, e.name, 'SKILL.md');
      if (exists(sf)) result.push({ rel: path.relative(ROOT, sf).replace(/\\/g, '/'), abs: sf, dir: path.dirname(sf) });
    }
  }
  return result;
}

function collectAgentFiles() {
  const abs = path.resolve(ROOT, '.claude/agents');
  if (!exists(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => path.relative(ROOT, path.join(abs, e.name)).replace(/\\/g, '/'));
}

function collectRuleFiles() {
  const abs = path.resolve(ROOT, '.claude/rules');
  if (!exists(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => ({
      rel: path.relative(ROOT, path.join(abs, e.name)).replace(/\\/g, '/'),
      abs: path.join(abs, e.name),
    }));
}

// ── checks ───────────────────────────────────────────────────────────

/** Check 1: SKILL.md frontmatter parseable */
function checkFrontmatter(skillFiles) {
  /** @type {Array<{severity:'ERROR'|'WARNING',file:string,line?:number,message:string}>} */
  const v = [];
  for (const sf of skillFiles) {
    const text = readFile(sf.abs);
    if (text == null) { v.push({ severity: 'ERROR', file: sf.rel, message: 'cannot read file' }); continue; }
    const { fm, error } = parseFrontmatter(text, sf.rel);
    if (error) { v.push({ severity: 'ERROR', file: sf.rel, message: `frontmatter: ${error}` }); continue; }
    if (!fm || !fm.name) { v.push({ severity: 'ERROR', file: sf.rel, message: 'frontmatter missing required field: name' }); continue; }
    // Store parsed frontmatter on the object for later checks
    sf.fm = fm;
  }
  return v;
}

/** Check 2: $variable usage ↔ arguments declaration */
function checkVariableConsistency(skillFiles) {
  const v = [];
  for (const sf of skillFiles) {
    if (!sf.fm) continue;
    const text = readFile(sf.abs);
    if (!text) continue;
    const { body } = parseFrontmatter(text, sf.rel);
    const varMatches = [...body.matchAll(/\$(\w+)/g)].map(m => m[1]);
    const usedVars = [...new Set(varMatches)];

    const declared = sf.fm.arguments || [];
    const declSet = new Set(declared);

    for (const uv of usedVars) {
      if (!declSet.has(uv)) {
        v.push({ severity: 'ERROR', file: sf.rel, message: `body uses $${uv} but arguments does not declare ${uv}` });
      }
    }

    // Reverse: declared but unused (WARNING only)
    for (const d of declared) {
      if (!usedVars.includes(d)) {
        v.push({ severity: 'WARNING', file: sf.rel, message: `arguments declares '${d}' but body never uses $${d}` });
      }
    }
  }
  return v;
}

/** Check 3: Cross-reference file existence ("详见", backtick-quoted paths) */
function checkCrossReferences(skillFiles) {
  const v = [];

  for (const sf of skillFiles) {
    const text = readFile(sf.abs);
    if (!text) continue;
    const { body } = parseFrontmatter(text, sf.rel);

    // Pattern 1: 详见 `path`
    const seeDetail = [...body.matchAll(/详见\s*`([^`]+)`/g)];
    // Pattern 2: standalone backtick paths in ref dirs
    const backtickPaths = [...body.matchAll(/`((?:(?:references|templates|checklists|checklist)\/[^`]+\.(?:md|json|yml|yaml)))`/gi)];

    const allRefs = new Set();
    for (const m of seeDetail) allRefs.add(m[1]);
    for (const m of backtickPaths) allRefs.add(m[1]);

    for (const ref of allRefs) {
      // Skip template variables
      if (ref.includes('$feature_id') || ref.includes('$')) continue;
      const resolved = path.resolve(sf.dir, ref);
      if (!exists(resolved)) {
        v.push({ severity: 'ERROR', file: sf.rel, message: `referenced file not found: ${ref} (resolved: ${path.relative(ROOT, resolved).replace(/\\/g, '/')})` });
      }
    }
  }
  return v;
}

/** Check 4: process-reference declared agents/skills exist */
function checkProcessReference() {
  const v = [];
  const f = path.resolve(ROOT, 'docs/process-reference.md');
  if (!exists(f)) {
    v.push({ severity: 'ERROR', file: 'docs/process-reference.md', message: 'file not found' });
    return v;
  }
  const text = readFile(f);
  const lines = text.split(/\r?\n/);

  let inAuxTable = false;
  let inDefectTable = false;

  // Collect all backtick names with their section context
  /** @type {Array<{name:string, isAux:boolean, isDefect:boolean, rowText:string}>} */
  const declared = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## 辅助 Skills')) { inAuxTable = true; continue; }
    if (line.startsWith('## 缺陷与回流规则')) { inDefectTable = true; inAuxTable = false; continue; }
    // Stop collecting after auxiliary table ends and defect table ends
    if (inAuxTable && line.trim() === '' && i > 0 && lines[i - 1].trim() === '') { inAuxTable = false; continue; }
    // Skip non-table lines and section headers before our tables
    if (!line.startsWith('|')) continue;
    // Extract backtick-quoted names from this table row
    const names = [...line.matchAll(/`([^`]+)`/g)].map(m => m[1]);

    // Filter out non-name backtick content (like file paths, status values)
    const skillAgentNames = names.filter(n => {
      if (n.includes('/') && !n.includes('.md')) return true;  // namespaced like superpowers:xxx
      if (n.includes(':') && !n.startsWith('http')) return true; // namespaced
      if (/^[a-z][\w-]*$/.test(n)) return true; // plain name
      if (/^[a-z][\w-]*-[a-z][\w-]*$/.test(n)) return true; // hyphenated name
      return false;
    });

    for (const n of skillAgentNames) {
      declared.push({
        name: n,
        isAux: inAuxTable,
        isDefect: inDefectTable,
        rowText: line, // store full row for optionality detection
      });
    }
  }

  // Check each declared name
  const agentFiles = collectAgentFiles();
  const skillDirs = collectSkillFiles().map(s => s.rel.replace('/SKILL.md', '').replace('.claude/skills/', '').replace('.agents/skills/', ''));

  const seen = new Set();
  for (const d of declared) {
    if (seen.has(d.name)) continue;
    seen.add(d.name);

    // Check if local file exists
    const hasSkill = skillDirs.includes(d.name);
    const hasAgent = agentFiles.some(a => a === `.claude/agents/${d.name}.md`);
    const isLocal = hasSkill || hasAgent;

    if (isLocal) continue;

    // Determine severity
    const isOptional = d.rowText && /如已安装/.test(d.rowText);
    const isAlternative = d.rowText && /或/.test(d.rowText);

    if (d.isDefect) {
      v.push({ severity: 'WARNING', file: 'docs/process-reference.md', message: `defect回流 references '${d.name}' but no local skill/agent found` });
    } else if (d.isAux || isOptional || isAlternative) {
      // Auxiliary table, explicitly optional ("如已安装"), or OR-alternative
      v.push({ severity: 'WARNING', file: 'docs/process-reference.md', message: `declared '${d.name}' is optional/remote (not installed locally)` });
    } else {
      // Main Loop A/B table — mandatory
      v.push({ severity: 'ERROR', file: 'docs/process-reference.md', message: `declared '${d.name}' in main process table but no local skill/agent found` });
    }
  }

  return v;
}

/** Check 5: Rule paths cover actual files */
function checkRulePaths() {
  const v = [];
  const rules = collectRuleFiles();
  for (const rule of rules) {
    const text = readFile(rule.abs);
    if (!text) { v.push({ severity: 'ERROR', file: rule.rel, message: 'cannot read rule file' }); continue; }
    const { fm, error } = parseFrontmatter(text, rule.rel);
    if (error || !fm) { v.push({ severity: 'ERROR', file: rule.rel, message: 'cannot parse frontmatter' }); continue; }
    if (!fm.paths || fm.paths.length === 0) { v.push({ severity: 'WARNING', file: rule.rel, message: 'no paths defined in frontmatter' }); continue; }

    for (const pattern of fm.paths) {
      const matches = matchGlobs([pattern]);
      if (matches.length === 0) {
        v.push({ severity: 'WARNING', file: rule.rel, message: `path pattern '${pattern}' matches zero files` });
      }
    }
  }
  return v;
}

/** Check 6: Template repo readiness */
function checkTemplateRepo() {
  const v = [];
  // .gitignore
  if (!exists(path.resolve(ROOT, '.gitignore'))) {
    v.push({ severity: 'WARNING', file: '.gitignore', message: 'missing .gitignore at project root' });
  }
  // README.md
  if (!exists(path.resolve(ROOT, 'README.md'))) {
    v.push({ severity: 'WARNING', file: 'README.md', message: 'missing README.md at project root' });
  }
  // project-bootstrap skill
  if (!exists(path.resolve(ROOT, '.claude/skills/project-bootstrap/SKILL.md'))) {
    v.push({ severity: 'ERROR', file: '.claude/skills/project-bootstrap/SKILL.md', message: 'bootstrap skill missing' });
  }
  // project-reference-template
  if (!exists(path.resolve(ROOT, 'docs/project-reference-template.md'))) {
    v.push({ severity: 'WARNING', file: 'docs/project-reference-template.md', message: 'project reference template missing' });
  }
  return v;
}

// ── main ─────────────────────────────────────────────────────────────

function main() {
  const skillFiles = collectSkillFiles();
  const allViolations = [
    ...checkFrontmatter(skillFiles),
    ...checkVariableConsistency(skillFiles),
    ...checkCrossReferences(skillFiles),
    ...checkProcessReference(),
    ...checkRulePaths(),
    ...checkTemplateRepo(),
  ];

  // Sort: ERROR first, then by file
  allViolations.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'ERROR' ? -1 : 1;
    return a.file.localeCompare(b.file);
  });

  // Print
  let count = 0;
  for (const v of allViolations) {
    const loc = v.line != null ? `${v.file}:${v.line}` : v.file;
    console.log(`[${v.severity}] ${loc}: ${v.message}`);
    count++;
  }

  const errors = allViolations.filter(v => v.severity === 'ERROR').length;
  const warnings = allViolations.filter(v => v.severity === 'WARNING').length;

  console.log(`\n─── ${count} violation(s): ${errors} error(s), ${warnings} warning(s) ───`);

  if (errors > 0) {
    console.log('❌ Pipeline validation FAILED');
    process.exit(1);
  } else {
    console.log('✅ Pipeline validation passed');
    process.exit(0);
  }
}

main();
