// 检查PPT中图片的分布
const fs = require('fs');

async function main() {
  const JSZip = require('jszip').default || require('jszip');

  const filePath = 'D:\\江城子·密州出猎PPT课件2.pptx';
  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)[1]);
      const numB = parseInt(b.match(/slide(\d+)/)[1]);
      return numA - numB;
    });

  console.log('原PPT各幻灯片图片分布:');
  console.log('========================');

  for (let i = 1; i <= slideFiles.length; i++) {
    const slidePath = `ppt/slides/slide${i}.xml`;
    const slideXml = await zip.file(slidePath)?.async('text');
    if (!slideXml) continue;

    const picMatches = slideXml.match(/<p:pic[^>]*>[\s\S]*?<\/p:pic>/g) || [];

    // 获取文本预览
    const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
    const texts = textMatches.map(m => m.replace(/<\/?a:t>/g, '')).filter(t => t.trim()).slice(0, 3);

    if (picMatches.length > 0) {
      console.log(`幻灯片 ${i}: 有 ${picMatches.length} 张图片 - "${texts.join(' | ')}"`);
    }
  }

  console.log('\n========================');
  console.log('总计:', slideFiles.length, '页');
}

main().catch(console.error);
