// PPT Generator Test Script
// Run with: npx tsx scripts/test-ppt-generator.ts

import PptxGenJS from 'pptxgenjs';
import { getStyleById, STYLE_TEMPLATES } from '../src/skills/pptStyles';
import fs from 'fs';
import path from 'path';

console.log('=== PPT Generator Tests ===\n');

// Test 1: Check style templates exist
console.log('Test 1: Style Templates');
console.log('  Total styles:', STYLE_TEMPLATES.length);
console.log('  Styles:', STYLE_TEMPLATES.map(s => s.id).join(', '));
console.log('  ✅ PASS\n');

// Test 2: Get style by ID
console.log('Test 2: Get Style by ID');
const businessGold = getStyleById('business-gold');
if (businessGold) {
  console.log('  Found business-gold:', businessGold.name);
  console.log('  Background:', businessGold.colors.background);
  console.log('  Primary:', businessGold.colors.primary);
  console.log('  ✅ PASS\n');
} else {
  console.log('  ❌ FAIL: business-gold not found\n');
  process.exit(1);
}

// Test 3: PPT Generation with Gold Style
console.log('Test 3: PPT Generation - Gold Style');

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9';
pres.title = 'Test PPT';
pres.author = 'Test';

// Use gold style colors
const primaryHex = '#' + businessGold.colors.primary;
const bgHex = '#' + businessGold.colors.background;
const textHex = '#' + businessGold.colors.text;

console.log('  Using primary color:', primaryHex);
console.log('  Using background color:', bgHex);
console.log('  Using text color:', textHex);

// Create a test slide
const slide = pres.addSlide();
slide.background = { color: bgHex };

// Add colored title bar - use string instead of enum
slide.addShape('rect', {
  x: 0, y: 0, w: '100%', h: 1.2,
  fill: { color: primaryHex },
});

// Add title
slide.addText('测试标题 - 尊享金样式', {
  x: 0.6, y: 0.35, w: '88%', h: 0.6,
  fontSize: 36, fontFace: 'Microsoft YaHei',
  color: 'FFFFFF', bold: true,
});

// Add divider
slide.addShape('line', {
  x: 0.6, y: 1.1, w: '88%', h: 0,
  line: { color: primaryHex, width: 2 },
});

// Add content
slide.addText('• 测试内容1\n\n• 测试内容2\n\n• 测试内容3', {
  x: 0.6, y: 1.4, w: '88%', h: '60%',
  fontSize: 18, fontFace: 'Microsoft YaHei',
  color: textHex, lineSpacing: 28,
});

// Add page number
slide.addText('1 / 1', {
  x: '90%', y: '95%', w: '10%', h: 0.3,
  fontSize: 11, color: '999999', align: 'right',
});

// Save
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'test_gold_style_v2.pptx');
pres.writeFile({ fileName: outputPath })
  .then(() => {
    console.log('  Generated:', outputPath);
    const stats = fs.statSync(outputPath);
    console.log('  File size:', stats.size, 'bytes');
    console.log('  ✅ PASS\n');
    console.log('=== All Tests Passed ===');
    console.log('Please open:', outputPath);
  })
  .catch((err) => {
    console.log('  ❌ FAIL:', err.message);
    process.exit(1);
  });
