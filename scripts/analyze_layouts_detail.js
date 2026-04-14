// 更详细分析示例PPT的布局结构
const fs = require('fs');

async function main() {
  const JSZip = require('jszip').default || require('jszip');

  const filePath = 'D:\\example.pptx';
  console.log('=== 详细分析示例PPT布局 ===\n');

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

  for (const slidePath of slideFiles) {
    const slideXml = await zip.file(slidePath)?.async('text');
    if (!slideXml) continue;

    const slideNum = slidePath.match(/slide(\d+)/)[1];
    console.log(`\n========== 幻灯片 ${slideNum} ==========`);

    // 获取所有文本
    const allTextMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
    const allTexts = allTextMatches.map(m => m.replace(/<\/?a:t>/g, '').trim()).filter(t => t);
    console.log(`文本内容: ${allTexts.join(' | ')}`);

    // 分析所有形状的位置
    const spTreeMatch = slideXml.match(/<p:spTree>[\s\S]*?<\/p:spTree>/);
    if (spTreeMatch) {
      const shapes = spTreeMatch[0].match(/<p:sp>[\s\S]*?<\/p:sp>/g) || [];
      console.log(`\n形状分析 (共${shapes.length}个):`);

      const layoutElements = [];

      for (const sp of shapes) {
        // 位置和尺寸
        const offMatch = sp.match(/<a:off\s+[^>]*x="([^"]+)"\s+y="([^"]+)"/);
        const extMatch = sp.match(/<a:ext\s+[^>]*cx="([^"]+)"\s+cy="([^"]+)"/);

        if (!offMatch || !extMatch) continue;

        const x = parseFloat(offMatch[1]) / 914400;
        const y = parseFloat(offMatch[2]) / 914400;
        const w = parseFloat(extMatch[1]) / 914400;
        const h = parseFloat(extMatch[2]) / 914400;

        // 判断形状类型
        let type = 'content';
        let isDecoration = false;

        // 检查是否是标题
        if (sp.includes('type="ctrTitle"') || sp.includes('type="title"')) {
          type = 'title';
        }
        // 检查是否是装饰元素（很小的高度）
        else if (h < 0.5) {
          type = 'decoration';
          isDecoration = true;
        }
        // 检查是否是横条（宽度很大，高度很小）
        else if (w > 8 && h < 0.6) {
          type = 'divider';
          isDecoration = true;
        }
        // 检查占位符类型
        else if (sp.includes('type="subTitle"')) {
          type = 'subtitle';
        }
        else if (sp.includes('type="body"')) {
          type = 'body';
        }

        // 获取形状的预设类型
        const prstMatch = sp.match(/prst="([^"]+)"/);
        const prst = prstMatch ? prstMatch[1] : 'rect';

        const element = { x, y, w, h, type, prst, isDecoration, sp };
        layoutElements.push(element);

        const posStr = `(${x.toFixed(2)}, ${y.toFixed(2)})`;
        const sizeStr = `${w.toFixed(2)}x${h.toFixed(2)}`;
        console.log(`  ${type.padEnd(12)} ${prst.padEnd(10)} ${posStr.padEnd(15)} ${sizeStr}`);
      }

      // 分析布局模式
      console.log('\n布局推断:');
      const contentAreas = layoutElements.filter(e => !e.isDecoration && e.type !== 'title');

      // 检查是否有底部横条
      const hasBottomBar = layoutElements.some(e => e.type === 'divider' && e.y > 4.5);

      // 检查布局类型
      if (contentAreas.length === 1) {
        console.log('  - 单栏布局');
      } else if (contentAreas.length === 2) {
        // 判断是左右还是上下
        const [a, b] = contentAreas;
        if (Math.abs(a.y - b.y) < 0.5) {
          console.log('  - 左右双栏布局');
        } else {
          console.log('  - 上下双栏布局');
        }
      } else if (contentAreas.length === 3) {
        console.log('  - 三栏布局');
      }

      if (hasBottomBar) {
        console.log('  - 底部横条装饰');
      }
    }
  }
}

main().catch(console.error);
