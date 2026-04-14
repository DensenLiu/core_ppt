// 分析示例PPT的布局结构
const fs = require('fs');

async function main() {
  const JSZip = require('jszip').default || require('jszip');

  const filePath = 'D:\\example.pptx';
  console.log('=== 分析示例PPT布局 ===\n');

  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  // 获取所有幻灯片
  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)[1]);
      const numB = parseInt(b.match(/slide(\d+)/)[1]);
      return numA - numB;
    });

  console.log(`幻灯片数量: ${slideFiles.length}\n`);

  for (const slidePath of slideFiles) {
    const slideXml = await zip.file(slidePath)?.async('text');
    if (!slideXml) continue;

    const slideNum = slidePath.match(/slide(\d+)/)[1];
    console.log(`=== 幻灯片 ${slideNum} ===`);

    // 提取文本内容
    const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
    const texts = textMatches.map(m => m.replace(/<\/?a:t>/g, '')).filter(t => t.trim());
    console.log(`  文本: ${texts.slice(0, 5).join(' | ')}`);

    // 检查是否有图片
    const hasPic = slideXml.includes('<p:pic>');
    const picMatches = slideXml.match(/<p:pic[^>]*>[\s\S]*?<\/p:pic>/g) || [];
    console.log(`  图片数量: ${picMatches.length}`);

    // 检查布局元素
    const hasShapes = slideXml.includes('<p:sp>');
    const hasTables = slideXml.includes('<a:tbl>') || slideXml.includes('<p:tbl');
    const hasChart = slideXml.includes('<c:chart') || slideXml.includes('chart');

    console.log(`  形状: ${hasShapes}, 表格: ${hasTables}, 图表: ${hasChart}`);

    // 分析占位符类型
    const placeholderTypes = slideXml.match(/type="(ctrTitle|title|subTitle|body|obj|pic)"/g) || [];
    console.log(`  占位符类型: ${placeholderTypes.join(', ') || '无'}`);

    // 提取位置信息（如果有图片）
    for (const picXml of picMatches) {
      const offMatch = picXml.match(/<a:off\s+[^>]*x="([^"]+)"\s+y="([^"]+)"/);
      const extMatch = picXml.match(/<a:ext\s+[^>]*cx="([^"]+)"\s+cy="([^"]+)"/);
      if (offMatch && extMatch) {
        const x = (parseFloat(offMatch[1]) / 914400).toFixed(2);
        const y = (parseFloat(offMatch[2]) / 914400).toFixed(2);
        const w = (parseFloat(extMatch[1]) / 914400).toFixed(2);
        const h = (parseFloat(extMatch[2]) / 914400).toFixed(2);
        console.log(`  图片位置: (${x}, ${y}) 尺寸: ${w} x ${h}`);
      }
    }

    // 分析 <p:sp> 形状的位置
    const shapeMatches = slideXml.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || [];
    console.log(`  形状数量: ${shapeMatches.length}`);

    for (let i = 0; i < Math.min(shapeMatches.length, 5); i++) {
      const spXml = shapeMatches[i];
      const offMatch = spXml.match(/<a:off\s+[^>]*x="([^"]+)"\s+y="([^"]+)"/);
      const extMatch = spXml.match(/<a:ext\s+[^>]*cx="([^"]+)"\s+cy="([^"]+)"/);
      if (offMatch && extMatch) {
        const x = (parseFloat(offMatch[1]) / 914400).toFixed(2);
        const y = (parseFloat(offMatch[2]) / 914400).toFixed(2);
        const w = (parseFloat(extMatch[1]) / 914400).toFixed(2);
        const h = (parseFloat(extMatch[2]) / 914400).toFixed(2);
        // 获取形状类型
        const prstMatch = spXml.match(/prst="([^"]+)"/);
        const prst = prstMatch ? prstMatch[1] : 'unknown';
        console.log(`    形状${i+1}: ${prst} at (${x}, ${y}) size ${w}x${h}`);
      }
    }

    console.log('');
  }
}

main().catch(console.error);
