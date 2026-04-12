#!/usr/bin/env tsx
/**
 * Export the Divine Comedy as a bilingual PDF with Doré illustrations.
 *
 * Run:
 *   npm run db:export-pdf
 *
 * Output:
 *   divine-comedy.pdf  (in project root)
 *
 * Requires:
 *   DATABASE_URL in .env.local
 *   puppeteer installed: npm install --save-dev puppeteer
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, inArray, asc } from 'drizzle-orm';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cantos, sections, works } from '../db/schema';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const dbUrl = process.env.DATABASE_URL ?? process.env.divecody_DATABASE_URL;
if (!dbUrl) { console.error('❌  DATABASE_URL required'); process.exit(1); }

const db = drizzle(neon(dbUrl));

const SECTION_IDS = ['inferno', 'purgatorio', 'paradiso'];
const PUBLIC_DIR = resolve(process.cwd(), 'public');
const DORE_JSON = JSON.parse(readFileSync(resolve(PUBLIC_DIR, 'data/dore.json'), 'utf8'));

function imageToBase64(relativePath: string): string | null {
  const abs = resolve(PUBLIC_DIR, relativePath.replace(/^\//, ''));
  if (!existsSync(abs)) return null;
  const ext = abs.endsWith('.svg') ? 'svg+xml' : 'jpeg';
  const data = readFileSync(abs).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

function getIllustration(sectionId: string, cantoNum: number): string | null {
  const url: string | undefined = DORE_JSON[sectionId]?.[String(cantoNum)];
  if (!url) return null;
  return imageToBase64(url);
}

function romanNumeral(n: number): string {
  const MAP: Record<number, string> = {
    1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',
    11:'XI',12:'XII',13:'XIII',14:'XIV',15:'XV',16:'XVI',17:'XVII',18:'XVIII',
    19:'XIX',20:'XX',21:'XXI',22:'XXII',23:'XXIII',24:'XXIV',25:'XXV',
    26:'XXVI',27:'XXVII',28:'XXVIII',29:'XXIX',30:'XXX',
    31:'XXXI',32:'XXXII',33:'XXXIII',34:'XXXIV',
  };
  return MAP[n] ?? String(n);
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildHtml(
  sectionData: {
    id: string;
    title: string;
    title_zh: string;
    emoji: string;
    cantos: {
      number: number;
      title_en: string;
      title_zh: string;
      lines_en: string[];
      lines_zh: string[];
      illustration: string | null;
    }[];
  }[],
  portrait: string | null,
): string {
  const sections_html = sectionData.map(sec => {
    const cantos_html = sec.cantos.map(c => {
      const illus = c.illustration
        ? `<div class="illus"><img src="${c.illustration}" alt="Doré illustration canto ${c.number}"></div>`
        : '';

      // Interleave zh/en paragraphs
      const len = Math.max(c.lines_en.length, c.lines_zh.length);
      const pairs = Array.from({ length: len }, (_, i) => {
        const zh = c.lines_zh[i] ?? '';
        const en = c.lines_en[i] ?? '';
        return `
          <div class="pair">
            <p class="zh">${esc(zh)}</p>
            <p class="en">${esc(en)}</p>
          </div>`;
      }).join('\n');

      const title_en = c.title_en || `Canto ${romanNumeral(c.number)}`;
      const title_zh = c.title_zh || `第${c.number}章`;

      return `
        <div class="canto" id="${sec.id}-${c.number}">
          ${illus}
          <div class="canto-header">
            <div class="canto-roman">${romanNumeral(c.number)}</div>
            <div class="canto-titles">
              <div class="canto-title-zh">${esc(title_zh)}</div>
              <div class="canto-title-en">${esc(title_en)}</div>
            </div>
          </div>
          <div class="verses">${pairs}</div>
        </div>`;
    }).join('\n');

    return `
      <div class="section-break">
        <div class="section-emoji">${sec.emoji}</div>
        <div class="section-title-zh">${esc(sec.title_zh)}</div>
        <div class="section-title-en">${esc(sec.title)}</div>
      </div>
      ${cantos_html}`;
  }).join('\n');

  const cover_portrait = portrait
    ? `<img class="portrait" src="${portrait}" alt="Dante Alighieri">`
    : '';

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm 18mm 22mm 18mm; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: "Noto Serif SC", "Source Han Serif CN", Georgia, "Times New Roman", serif;
    background: #faf8f3;
    color: #1a1610;
    font-size: 10pt;
    line-height: 1.85;
  }

  /* ── Cover ─────────────────────────────────────────────── */
  .cover {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 40px 20px;
    background: #1a1610;
    color: #c4a35a;
  }
  .cover .portrait {
    width: 180px;
    height: auto;
    border-radius: 4px;
    margin-bottom: 32px;
    filter: sepia(0.3) brightness(0.9);
    border: 2px solid #c4a35a;
  }
  .cover-title-zh {
    font-size: 40pt;
    letter-spacing: 0.15em;
    margin-bottom: 10px;
    color: #e8d5a0;
  }
  .cover-title-en {
    font-size: 18pt;
    letter-spacing: 0.25em;
    color: #c4a35a;
    margin-bottom: 24px;
    font-style: italic;
  }
  .cover-author {
    font-size: 13pt;
    color: #a08040;
    letter-spacing: 0.1em;
    margin-bottom: 6px;
  }
  .cover-author-zh {
    font-size: 11pt;
    color: #806030;
    letter-spacing: 0.08em;
  }
  .cover-year {
    margin-top: 40px;
    font-size: 9pt;
    color: #604820;
    letter-spacing: 0.2em;
  }

  /* ── Section break page ─────────────────────────────────── */
  .section-break {
    page-break-before: always;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    background: #f2ede2;
    padding: 40px;
  }
  .section-emoji { font-size: 60pt; margin-bottom: 24px; }
  .section-title-zh {
    font-size: 32pt;
    letter-spacing: 0.2em;
    color: #1a1610;
    margin-bottom: 12px;
  }
  .section-title-en {
    font-size: 14pt;
    letter-spacing: 0.3em;
    color: #806030;
    font-style: italic;
  }

  /* ── Illustration ───────────────────────────────────────── */
  .illus {
    page-break-before: always;
    text-align: center;
    margin-bottom: 0;
  }
  .illus img {
    max-width: 100%;
    max-height: 230mm;
    object-fit: contain;
    display: block;
    margin: 0 auto;
  }

  /* ── Canto header ───────────────────────────────────────── */
  .canto-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 0 14px;
    border-bottom: 1px solid #c4a35a;
    margin-bottom: 16px;
  }
  .canto-roman {
    font-size: 36pt;
    color: #c4a35a;
    font-style: italic;
    min-width: 60px;
    text-align: right;
    line-height: 1;
  }
  .canto-title-zh {
    font-size: 14pt;
    letter-spacing: 0.05em;
    color: #1a1610;
    line-height: 1.4;
  }
  .canto-title-en {
    font-size: 9.5pt;
    color: #806030;
    font-style: italic;
    letter-spacing: 0.04em;
  }

  /* ── Bilingual verse pairs ──────────────────────────────── */
  .verses { padding: 0 2px; }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 28px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e8e0cc;
  }
  .pair:last-child { border-bottom: none; }

  .zh {
    font-size: 10pt;
    line-height: 1.9;
    color: #1a1610;
    text-align: justify;
  }
  .en {
    font-size: 9pt;
    line-height: 1.85;
    color: #403820;
    text-align: justify;
    font-style: italic;
    border-left: 2px solid #e0d0a8;
    padding-left: 14px;
  }

  /* keep pairs together where possible */
  .pair { break-inside: avoid; }
  .canto-header { break-inside: avoid; }
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  ${cover_portrait}
  <div class="cover-title-zh">神曲</div>
  <div class="cover-title-en">The Divine Comedy</div>
  <div class="cover-author">Dante Alighieri</div>
  <div class="cover-author-zh">但丁·阿利吉耶里</div>
  <div class="cover-year">1308 – 1320</div>
</div>

${sections_html}

</body>
</html>`;
}

async function main() {
  console.log('\n📖  Divine Comedy PDF Export\n');

  // Fetch sections
  const sectionRows = await db
    .select()
    .from(sections)
    .where(inArray(sections.id, SECTION_IDS))
    .orderBy(asc(sections.number));

  // Fetch all cantos for these sections
  const cantoRows = await db
    .select({
      section_id: cantos.section_id,
      number: cantos.number,
      title_en: cantos.title_en,
      title_zh: cantos.title_zh,
      lines_en: cantos.lines_en,
      lines_zh: cantos.lines_zh,
    })
    .from(cantos)
    .where(inArray(cantos.section_id, SECTION_IDS))
    .orderBy(asc(cantos.section_id), asc(cantos.number));

  const totalCantos = cantoRows.length;
  console.log(`  Sections: ${sectionRows.length}  Cantos: ${totalCantos}`);

  // Build section data
  const sectionData = sectionRows.map(sec => ({
    id: sec.id,
    title: sec.title,
    title_zh: sec.title_zh ?? sec.title,
    emoji: sec.emoji ?? '📖',
    cantos: cantoRows
      .filter(c => c.section_id === sec.id)
      .sort((a, b) => a.number - b.number)
      .map(c => {
        const illustration = getIllustration(sec.id, c.number);
        if (illustration) process.stdout.write('🖼 ');
        else process.stdout.write('  ');
        return {
          number: c.number,
          title_en: c.title_en ?? '',
          title_zh: c.title_zh ?? '',
          lines_en: (c.lines_en ?? []) as string[],
          lines_zh: (c.lines_zh ?? c.lines_en ?? []) as string[],
          illustration,
        };
      }),
  }));
  console.log('\n');

  // Portrait
  const portrait = imageToBase64('/dante-portrait.jpg');

  // Build HTML
  console.log('  Generating HTML…');
  const html = buildHtml(sectionData, portrait);

  const htmlPath = resolve(process.cwd(), 'divine-comedy.html');
  writeFileSync(htmlPath, html, 'utf8');
  console.log(`  ✅  HTML written: ${htmlPath}  (${(html.length / 1024 / 1024).toFixed(1)} MB)`);

  // Render to PDF with puppeteer
  console.log('  Rendering PDF…');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let puppeteer: any;
  try {
    puppeteer = await import('puppeteer' as string);
  } catch {
    console.log('\n⚠️  puppeteer not found. Install it and re-run:');
    console.log('   npm install --save-dev puppeteer\n');
    console.log('   Or open divine-comedy.html in Chrome and print → Save as PDF.');
    process.exit(0);
  }

  const browser = await (puppeteer.default ?? puppeteer).launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 120000 });

  const pdfPath = resolve(process.cwd(), 'divine-comedy.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '18mm', bottom: '22mm', left: '18mm' },
  });

  await browser.close();
  const size = (readFileSync(pdfPath).length / 1024 / 1024).toFixed(1);
  console.log(`\n🎉  PDF written: ${pdfPath}  (${size} MB)\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
