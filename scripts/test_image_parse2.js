// 直接测试解析逻辑
const fs = require('fs');

async function main() {
  const JSZip = require('jszip').default || require('jszip');

  const filePath = 'D:\\江城子·密州出猎PPT课件2.pptx';
  console.log('=== 直接测试解析逻辑 ===');

  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  // 模拟 parseImages 的核心逻辑
  const slideIndex = 1;
  const slidePath = `ppt/slides/slide${slideIndex}.xml`;
  const slideXml = await zip.file(slidePath)?.async('text');

  // 构建 slide rel map
  const slideRelsPath = `ppt/slides/_rels/slide${slideIndex}.xml.rels`;
  const slideRelsXml = await zip.file(slideRelsPath)?.async('text');
  const relMap = {};

  if (slideRelsXml) {
    const relMatches = slideRelsXml.match(/<Relationship\s+[^>]*>/g) || [];
    for (const match of relMatches) {
      const idMatch = match.match(/Id="([^"]+)"/);
      const targetMatch = match.match(/Target="([^"]+)"/);
      if (idMatch && targetMatch) {
        relMap[idMatch[1]] = targetMatch[1];
      }
    }
  }

  console.log('relMap:', relMap);

  // 查找 <p:pic> 元素
  const picMatches = slideXml.match(/<p:pic[^>]*>[\s\S]*?<\/p:pic>/g) || [];
  console.log('\n<p:pic> 元素数量:', picMatches.length);

  for (const picXml of picMatches) {
    // 在 <p:pic> 内部查找 <a:blip r:embed="...">
    const blipEmbedMatch = picXml.match(/<a:blip\s+[^>]*r:embed="([^"]+)"[^>]*>/);
    if (!blipEmbedMatch) {
      console.log('  未找到 <a:blip r:embed>');
      continue;
    }

    const relId = blipEmbedMatch[1];
    console.log('  relId from <a:blip r:embed>:', relId);

    let imagePath = relMap[relId];
    console.log('  imagePath from relMap:', imagePath);

    if (imagePath) {
      if (imagePath.startsWith('../')) {
        imagePath = `ppt/${imagePath.replace('../', '')}`;
      } else if (!imagePath.startsWith('ppt/')) {
        imagePath = `ppt/${imagePath}`;
      }
      console.log('  最终路径:', imagePath);

      const imageFile = zip.file(imagePath);
      if (imageFile) {
        const imageBuffer = await imageFile.async('arraybuffer');
        const base64 = Buffer.from(imageBuffer).toString('base64');
        console.log('  文件大小:', imageBuffer.byteLength, 'bytes');
        console.log('  base64 长度:', base64.length);
        console.log('  base64 前80字符:', base64.substring(0, 80), '...');
      }
    }
  }

  // 提取位置信息
  console.log('\n=== 位置信息提取 ===');
  for (const picXml of picMatches) {
    const offMatch = picXml.match(/<a:off\s+[^>]*x="([^"]+)"\s+y="([^"]+)"/);
    const extMatch = picXml.match(/<a:ext\s+[^>]*cx="([^"]+)"\s+cy="([^"]+)"/);

    if (offMatch) {
      console.log('位置: x=', parseFloat(offMatch[1]) / 914400, 'y=', parseFloat(offMatch[2]) / 914400);
    }
    if (extMatch) {
      console.log('尺寸: cx=', parseFloat(extMatch[1]) / 914400, 'cy=', parseFloat(extMatch[2]) / 914400);
    }
  }
}

main().catch(console.error);
