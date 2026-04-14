// 完整测试所有幻灯片的图片解析
const fs = require('fs');

async function main() {
  const JSZip = require('jszip').default || require('jszip');

  const filePath = 'D:\\江城子·密州出猎PPT课件2.pptx';
  console.log('=== 完整测试所有幻灯片图片解析 ===\n');

  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const slideFiles = Object.keys(zip.files).filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/));

  let totalImages = 0;
  let imagesWithBase64 = 0;

  for (let i = 1; i <= slideFiles.length; i++) {
    const slidePath = `ppt/slides/slide${i}.xml`;
    const slideXml = await zip.file(slidePath)?.async('text');
    if (!slideXml) continue;

    // 构建 slide rel map
    const slideRelsPath = `ppt/slides/_rels/slide${i}.xml.rels`;
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

    // 查找 <p:pic> 元素
    const picMatches = slideXml.match(/<p:pic[^>]*>[\s\S]*?<\/p:pic>/g) || [];

    if (picMatches.length > 0) {
      console.log(`幻灯片 ${i}:`);

      for (const picXml of picMatches) {
        const blipEmbedMatch = picXml.match(/<a:blip\s+[^>]*r:embed="([^"]+)"[^>]*>/);
        if (!blipEmbedMatch) continue;

        const relId = blipEmbedMatch[1];
        let imagePath = relMap[relId];

        if (imagePath) {
          if (imagePath.startsWith('../')) {
            imagePath = `ppt/${imagePath.replace('../', '')}`;
          } else if (!imagePath.startsWith('ppt/')) {
            imagePath = `ppt/${imagePath}`;
          }

          const imageFile = zip.file(imagePath);
          if (imageFile) {
            const imageBuffer = await imageFile.async('arraybuffer');
            const base64 = Buffer.from(imageBuffer).toString('base64');
            totalImages++;
            imagesWithBase64++;

            const offMatch = picXml.match(/<a:off\s+[^>]*x="([^"]+)"\s+y="([^"]+)"/);
            const extMatch = picXml.match(/<a:ext\s+[^>]*cx="([^"]+)"\s+cy="([^"]+)"/);

            console.log(`  [✓] ${imagePath}`);
            console.log(`      大小: ${(imageBuffer.byteLength / 1024).toFixed(1)} KB`);
            console.log(`      base64: ${base64.length} 字符`);
            if (offMatch && extMatch) {
              console.log(`      位置: (${(parseFloat(offMatch[1])/914400).toFixed(2)}, ${(parseFloat(offMatch[2])/914400).toFixed(2)})`);
              console.log(`      尺寸: ${(parseFloat(extMatch[1])/914400).toFixed(2)} x ${(parseFloat(extMatch[2])/914400).toFixed(2)} 英寸`);
            }
          }
        }
      }
    }
  }

  console.log(`\n=== 总计 ===`);
  console.log(`图片总数: ${totalImages}`);
  console.log(`可提取 base64: ${imagesWithBase64}`);
}

main().catch(console.error);
