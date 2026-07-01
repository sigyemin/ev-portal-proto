#!/usr/bin/env node
/* =========================================================
   build-i18n-langpack.js — V3.2 i18n 사전 통합 빌더
   ---------------------------------------------------------
   - 6개 i18n-*.js 사전을 단일 통합 사전으로 합치고
   - 4가지 포맷으로 export:
       1) langpack/i18n.json     (DB import 호환 JSON)
       2) langpack/i18n.csv      (스프레드시트/엑셀 호환)
       3) langpack/i18n.sql      (DB INSERT 문, MySQL/PostgreSQL 호환)
       4) langpack/i18n.tsv      (TSV — 한글 콤마 회피)
   - 검수 리포트 (langpack/REPORT.md)
       * 누락 영문 / 동일 영문 한글 / 너무 긴 영문 / 의심 표현 등
   ---------------------------------------------------------
   실행:  node scripts/build-i18n-langpack.js
   ========================================================= */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const OUT_DIR = path.join(ROOT, 'langpack');

/* ---------- 사전 파일 목록 (i18n.js 코어 제외) ---------- */
const DICT_FILES = [
  { file: 'i18n-common.js',  scope: 'common'   },
  { file: 'i18n-home.js',    scope: 'home'     },
  { file: 'i18n-mypage.js',  scope: 'mypage'   },
  { file: 'i18n-subsidy.js', scope: 'subsidy'  },
  { file: 'i18n-charging.js',scope: 'charging' }
];

/* ---------- 1. 모든 사전 통합 ---------- */
function extractDict(srcPath) {
  const code = fs.readFileSync(srcPath, 'utf8');
  // window.__i18n.register({ ... }) 사이의 객체 리터럴을 캡처
  const m = code.match(/window\.__i18n\.register\(\{([\s\S]*?)\}\);/);
  if (!m) return {};
  // 가짜 컨텍스트에서 객체 평가
  const objLiteral = '({' + m[1] + '})';
  try {
    return vm.runInNewContext(objLiteral, {});
  } catch (e) {
    console.error('Parse error:', srcPath, e.message);
    return {};
  }
}

const MERGED = {};   // { key: { ko, en, scope } }

DICT_FILES.forEach(({ file, scope }) => {
  const p = path.join(JS_DIR, file);
  if (!fs.existsSync(p)) {
    console.warn('Skip (not found):', file);
    return;
  }
  const dict = extractDict(p);
  Object.keys(dict).forEach(key => {
    if (MERGED[key]) {
      console.warn('Duplicate key:', key, '(in', scope, '— previous:', MERGED[key].scope + ')');
    }
    MERGED[key] = {
      ko: dict[key].ko != null ? dict[key].ko : '',
      en: dict[key].en != null ? dict[key].en : '',
      scope: scope
    };
  });
});

const TOTAL = Object.keys(MERGED).length;
console.log('Total keys merged:', TOTAL);

/* ---------- 출력 디렉토리 준비 ---------- */
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ---------- 2. JSON export (DB import 호환) ---------- */
const jsonOut = {
  meta: {
    project: 'ev-portal-prototype-V3.2',
    generated: new Date().toISOString(),
    total_keys: TOTAL,
    languages: ['ko', 'en']
  },
  translations: Object.keys(MERGED).sort().map(key => ({
    key,
    scope: MERGED[key].scope,
    ko: MERGED[key].ko,
    en: MERGED[key].en
  }))
};
fs.writeFileSync(path.join(OUT_DIR, 'i18n.json'), JSON.stringify(jsonOut, null, 2), 'utf8');
console.log('Wrote: langpack/i18n.json');

/* ---------- 3. CSV export ---------- */
function csvCell(s) {
  s = String(s == null ? '' : s);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
const csvRows = ['key,scope,ko,en'];
Object.keys(MERGED).sort().forEach(key => {
  const r = MERGED[key];
  csvRows.push([csvCell(key), csvCell(r.scope), csvCell(r.ko), csvCell(r.en)].join(','));
});
fs.writeFileSync(path.join(OUT_DIR, 'i18n.csv'), '﻿' + csvRows.join('\n'), 'utf8'); // BOM for Excel
console.log('Wrote: langpack/i18n.csv');

/* ---------- 4. TSV export (한글 콤마와 충돌 없음) ---------- */
const tsvRows = ['key\tscope\tko\ten'];
Object.keys(MERGED).sort().forEach(key => {
  const r = MERGED[key];
  const ko = String(r.ko || '').replace(/[\t\n\r]/g, ' ');
  const en = String(r.en || '').replace(/[\t\n\r]/g, ' ');
  tsvRows.push([key, r.scope, ko, en].join('\t'));
});
fs.writeFileSync(path.join(OUT_DIR, 'i18n.tsv'), tsvRows.join('\n'), 'utf8');
console.log('Wrote: langpack/i18n.tsv');

/* ---------- 5. SQL export (MySQL/PostgreSQL 호환) ---------- */
function sqlEsc(s) {
  return String(s == null ? '' : s).replace(/'/g, "''");
}
const sqlLines = [];
sqlLines.push('-- ============================================');
sqlLines.push('-- V3.2 i18n Language Pack — DB Import');
sqlLines.push('-- Project: ev-portal-prototype-V3.2');
sqlLines.push('-- Generated: ' + new Date().toISOString());
sqlLines.push('-- Total: ' + TOTAL + ' keys');
sqlLines.push('-- ============================================');
sqlLines.push('');
sqlLines.push('-- Table schema (예시 — MySQL):');
sqlLines.push('-- CREATE TABLE IF NOT EXISTS i18n_translations (');
sqlLines.push('--   id          BIGINT AUTO_INCREMENT PRIMARY KEY,');
sqlLines.push('--   message_key VARCHAR(200) NOT NULL UNIQUE,');
sqlLines.push('--   scope       VARCHAR(40)  NOT NULL,');
sqlLines.push('--   ko          TEXT         NOT NULL,');
sqlLines.push('--   en          TEXT         NOT NULL,');
sqlLines.push('--   created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,');
sqlLines.push('--   updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
sqlLines.push('--   INDEX idx_scope (scope)');
sqlLines.push('-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
sqlLines.push('');
sqlLines.push('-- DELETE FROM i18n_translations;  -- 전체 갱신 시 사용');
sqlLines.push('');
sqlLines.push('INSERT INTO i18n_translations (message_key, scope, ko, en) VALUES');

const valuesLines = Object.keys(MERGED).sort().map(key => {
  const r = MERGED[key];
  return `  ('${sqlEsc(key)}', '${sqlEsc(r.scope)}', '${sqlEsc(r.ko)}', '${sqlEsc(r.en)}')`;
});
sqlLines.push(valuesLines.join(',\n') + ';');
sqlLines.push('');

fs.writeFileSync(path.join(OUT_DIR, 'i18n.sql'), sqlLines.join('\n'), 'utf8');
console.log('Wrote: langpack/i18n.sql');

/* ---------- 6. 검수 리포트 (REPORT.md) ---------- */
const issues = {
  missingEn:        [],  // 영문 미작성
  identicalKoEn:    [],  // 한글-영문 동일 (의심)
  veryLongEn:       [],  // 영문이 한글보다 1.5배 이상 길음 (레이아웃 위험)
  emptyEn:          [],  // 영문 빈 값
  htmlInValue:      [],  // <strong>, <br> 등 HTML 포함 (data-i18n-html 권장 확인)
  suspectKoOnly:    []   // ko/en 모두 한글 (영문 추출 실패 가능)
};
Object.keys(MERGED).forEach(key => {
  const r = MERGED[key];
  const ko = r.ko || '';
  const en = r.en || '';
  if (!en && ko)             issues.missingEn.push({ key, ko });
  if (en === '' && ko !== '') issues.emptyEn.push({ key, ko });
  if (en && ko && en === ko) issues.identicalKoEn.push({ key, ko, en });
  // 한글 1자 ≈ 1.5 영문자 가정 — 영문이 한글*3 이상이면 너무 김
  if (ko && en && en.length > ko.length * 3 && ko.length > 4) {
    issues.veryLongEn.push({ key, ko, en, ratio: (en.length / ko.length).toFixed(1) });
  }
  if (/<[a-z]+/i.test(ko) || /<[a-z]+/i.test(en)) {
    issues.htmlInValue.push({ key, ko, en });
  }
  if (en && /[가-힣]/.test(en)) issues.suspectKoOnly.push({ key, ko, en });
});

const mdLines = [];
mdLines.push('# V3.2 i18n 언어팩 검수 리포트');
mdLines.push('');
mdLines.push('생성: ' + new Date().toISOString());
mdLines.push('총 키: **' + TOTAL + '**');
mdLines.push('');
mdLines.push('## 1. 영문 미작성 (총 ' + issues.missingEn.length + '건)');
issues.missingEn.forEach(i => mdLines.push('- `' + i.key + '` — ko: "' + i.ko + '"'));
mdLines.push('');
mdLines.push('## 2. 한국어가 영문 값에 섞임 (총 ' + issues.suspectKoOnly.length + '건)');
issues.suspectKoOnly.forEach(i => mdLines.push('- `' + i.key + '` — en: "' + i.en + '"'));
mdLines.push('');
mdLines.push('## 3. 한글=영문 동일 (의심, 총 ' + issues.identicalKoEn.length + '건)');
mdLines.push('> 영문/숫자/약어로 동일한 경우는 OK (예: K-EV100, NACS, POPUP, OPEN, BMW 등)');
issues.identicalKoEn.forEach(i => mdLines.push('- `' + i.key + '` — "' + i.ko + '"'));
mdLines.push('');
mdLines.push('## 4. 영문이 한글의 3배 초과 (레이아웃 위험, 총 ' + issues.veryLongEn.length + '건)');
issues.veryLongEn.forEach(i => mdLines.push('- `' + i.key + '` — 비율 ' + i.ratio + 'x | ko: "' + i.ko + '" | en: "' + i.en + '"'));
mdLines.push('');
mdLines.push('## 5. HTML 마크업 포함 (data-i18n-html로 처리 필요, 총 ' + issues.htmlInValue.length + '건)');
issues.htmlInValue.forEach(i => mdLines.push('- `' + i.key + '`'));
mdLines.push('');
mdLines.push('## 6. 통계');
const byScope = {};
Object.keys(MERGED).forEach(k => {
  const s = MERGED[k].scope;
  byScope[s] = (byScope[s] || 0) + 1;
});
Object.keys(byScope).sort().forEach(s => mdLines.push('- ' + s + ': ' + byScope[s] + ' keys'));

fs.writeFileSync(path.join(OUT_DIR, 'REPORT.md'), mdLines.join('\n'), 'utf8');
console.log('Wrote: langpack/REPORT.md');

console.log('\n=== Summary ===');
console.log('Missing EN:        ', issues.missingEn.length);
console.log('Identical KO=EN:   ', issues.identicalKoEn.length);
console.log('Very long EN:      ', issues.veryLongEn.length);
console.log('KO chars in EN:    ', issues.suspectKoOnly.length);
console.log('HTML in value:     ', issues.htmlInValue.length);
console.log('Empty EN:          ', issues.emptyEn.length);
