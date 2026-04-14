// 测试 parsePPTX 函数
const path = require('path');

async function main() {
  const { parsePPTX, parsedPPTToMarkdown } = require('../src/lib/pptParser');

  const filePath = 'D:\\江城子·密州出猎PPT课件2.pptx';
  console.log('=== 测试 parsePPTX ===');
  console.log('文件路径:', filePath);

  const parsed = await parsePPTX(filePath);

  console.log('\n=== 解析结果 ===');
  console.log('幻灯片数量:', parsed.slides.length);
  console.log('文档标题:', parsed.title);

  let totalImages = 0;
  let imagesWithBase64 = 0;

  for (const slide of parsed.slides) {
    if (slide.images && slide.images.length > 0) {
      console.log(`\n幻灯片 ${slide.index}:`);
      for (const img of slide.images) {
        totalImages++;
        console.log(`  - ${img.name}`);
        console.log(`    路径: ${img.originalPath}`);
        console.log(`    位置: x=${img.position.x.toFixed(2)}, y=${img.position.y.toFixed(2)}`);
        console.log(`    尺寸: ${img.position.cx.toFixed(2)}x${img.position.cy.toFixed(2)}`);
        if (img.base64) {
          imagesWithBase64++;
          console.log(`    Base64 长度: ${img.base64.length}`);
          console.log(`    Base64 前50字符: ${img.base64.substring(0, 50)}...`);
        } else if (img.placeholder) {
          console.log(`    占位符: ${img.placeholder}`);
        }
      }
    }
  }

  console.log(`\n=== 总计 ===`);
  console.log(`图片总数: ${totalImages}`);
  console.log(`有 base64 数据的图片: ${imagesWithBase64}`);

  // 输出 markdown 格式的内容
  console.log('\n=== Markdown 内容预览 ===');
  const markdown = parsedPPTToMarkdown(parsed);
  console.log(markdown.substring(0, 2000));
}

main().catch(console.error);
