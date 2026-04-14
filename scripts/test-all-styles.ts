// Test all styles
// Run with: npx tsx scripts/test-all-styles.ts

import PptxGenJS from 'pptxgenjs';
import { getAllStyles } from '../src/skills/pptStyles';
import fs from 'fs';
import path from 'path';

const styles = getAllStyles();

console.log('=== Testing All Styles ===\n');

const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function testStyle(style: typeof styles[0]) {
  console.log(`Testing: ${style.id} (${style.name})`);

  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.title = style.name;
  pres.author = 'Test';

  const primaryHex = '#' + style.colors.primary;
  const bgHex = '#' + style.colors.background;
  const textHex = '#' + style.colors.text;
  const isDarkBg = style.colors.background.toLowerCase().startsWith('1') ||
                   style.colors.background.toLowerCase().startsWith('2');

  console.log(`  Primary: ${primaryHex}, Background: ${bgHex}, Dark: ${isDarkBg}`);

  const slide = pres.addSlide();
  slide.background = { color: bgHex };

  if (style.decorations?.showTopBar) {
    slide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: 1.2,
      fill: { color: primaryHex },
    });

    slide.addText(style.name + ' - ' + style.description, {
      x: 0.6, y: 0.35, w: '88%', h: 0.6,
      fontSize: style.sizes.title,
      fontFace: style.fonts.title,
      color: 'FFFFFF', bold: true,
    });
  } else {
    slide.addText(style.name + ' - ' + style.description, {
      x: 0.6, y: 0.5, w: '88%', h: 0.8,
      fontSize: style.sizes.title,
      fontFace: style.fonts.title,
      color: primaryHex, bold: true,
    });
  }

  if (style.decorations?.dividerStyle === 'line') {
    slide.addShape('line', {
      x: 0.6, y: 1.2, w: '88%', h: 0,
      line: { color: primaryHex, width: 2 },
    });
  }

  const contentText = '• 第一条内容\n\n• 第二条内容\n\n• 第三条内容';
  slide.addText(contentText, {
    x: 0.6, y: 1.5, w: '88%', h: '60%',
    fontSize: style.sizes.body,
    fontFace: style.fonts.body,
    color: isDarkBg ? '#FFFFFF' : textHex,
    lineSpacing: 28,
  });

  if (style.decorations?.showPageNumber) {
    slide.addText('1 / 1', {
      x: '90%', y: '95%', w: '10%', h: 0.3,
      fontSize: style.sizes.small,
      color: isDarkBg ? '#CCCCCC' : '#999999',
      align: 'right',
    });
  }

  const outputPath = path.join(outputDir, `test_${style.id}.pptx`);
  await pres.writeFile({ fileName: outputPath });
  const stats = fs.statSync(outputPath);
  console.log(`  ✅ Generated: ${stats.size} bytes\n`);
}

async function run() {
  for (const style of styles) {
    try {
      await testStyle(style);
    } catch (err) {
      console.log(`  ❌ FAIL: ${err}\n`);
    }
  }
  console.log('=== All Styles Tested ===');
}

run();
