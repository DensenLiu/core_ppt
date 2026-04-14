import JSZip from 'jszip';

interface SlideElement {
  type: 'title' | 'text' | 'chart' | 'table' | 'image' | 'shape';
  content: string;
  position?: { x: number; y: number };
}

interface TableData {
  rows: number;
  cols: number;
  data: string[][];
}

interface ChartData {
  type: string;
  title: string;
  categories: string[];
  series: { name: string; values: number[] }[];
}

interface ImageData {
  id: string;
  name: string;
  originalPath: string;  // PPTX 内部路径
  position: { x: number; y: number; cx: number; cy: number }; // 位置和尺寸
  placeholder?: string;  // 如果图片无法提取，用占位符描述
  base64?: string;       // 图片的 base64 编码数据
}

interface ParsedSlide {
  index: number;
  title: string;
  elements: SlideElement[];
  tables?: TableData[];
  charts?: ChartData[];
  images?: ImageData[];
  notes?: string;
}

interface ParsedPPT {
  slides: ParsedSlide[];
  title: string;
  author: string;
}

/**
 * 解析 PPTX 文件，提取文本、表格、图表等内容
 */
export async function parsePPTX(filePath: string): Promise<ParsedPPT> {
  const fs = await import('fs/promises');
  const fileBuffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const result: ParsedPPT = {
    slides: [],
    title: '',
    author: '',
  };

  // Parse presentation.xml to get slide relationships
  const pptXml = await zip.file('ppt/presentation.xml')?.async('text');
  if (!pptXml) {
    throw new Error('Invalid PPTX file: missing presentation.xml');
  }

  // Get slide order
  const slideIds: string[] = [];
  const slideMatches = pptXml.match(/<p:sldId\s+[^>]*r:id="([^"]+)"[^>]*\/>/g) || [];
  for (const match of slideMatches) {
    const idMatch = match.match(/r:id="([^"]+)"/);
    if (idMatch) {
      slideIds.push(idMatch[1]);
    }
  }

  // Get relationship mapping
  const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text');
  const relMap: Record<string, string> = {};
  const chartMap: Record<string, string> = {};
  const tableMap: Record<string, string> = {};

  if (relsXml) {
    const relMatches = relsXml.match(/<Relationship\s+[^>]*>/g) || [];
    for (const match of relMatches) {
      const idMatch = match.match(/Id="([^"]+)"/);
      const targetMatch = match.match(/Target="([^"]+)"/);
      const typeMatch = match.match(/Type="([^"]+)"/);

      if (idMatch && targetMatch) {
        const target = targetMatch[1];
        relMap[idMatch[1]] = target;

        // 记录 chart 和 table 关系
        if (typeMatch && typeMatch[1].includes('chart')) {
          chartMap[idMatch[1]] = target;
        }
        if (typeMatch && typeMatch[1].includes('table')) {
          tableMap[idMatch[1]] = target;
        }
      }
    }
  }

  // Parse each slide
  for (let i = 0; i < slideIds.length; i++) {
    const slideRelId = slideIds[i];
    const slidePath = `ppt/${relMap[slideRelId]?.replace('../', '')}`;

    try {
      const slideXml = await zip.file(slidePath)?.async('text');
      if (slideXml) {
        // 解析图表数据
        const charts = await parseCharts(zip, slideXml, relMap, chartMap);

        // 解析表格数据
        const tables = await parseTables(zip, slideXml, relMap, tableMap);

        // 解析图像数据
        const images = await parseImages(zip, slideXml, i + 1, relMap);

        // 解析批注
        const notes = await parseNotes(zip, i + 1);

        const parsedSlide = parseSlide(slideXml, i + 1);
        parsedSlide.charts = charts;
        parsedSlide.tables = tables;
        parsedSlide.images = images;
        parsedSlide.notes = notes;

        result.slides.push(parsedSlide);

        // Use first non-empty title as document title
        if (!result.title && parsedSlide.title) {
          result.title = parsedSlide.title;
        }
      }
    } catch (error) {
      console.warn(`Failed to parse slide ${i + 1}:`, error);
    }
  }

  // Try to get author from core.xml
  try {
    const coreXml = await zip.file('docProps/core.xml')?.async('text');
    if (coreXml) {
      const authorMatch = coreXml.match(/<dc:creator>([^<]+)<\/dc:creator>/);
      if (authorMatch) {
        result.author = authorMatch[1];
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return result;
}

/**
 * 解析图表数据
 */
async function parseCharts(zip: JSZip, slideXml: string, relMap: Record<string, string>, chartMap: Record<string, string> = {}): Promise<ChartData[]> {
  const charts: ChartData[] = [];

  // 查找图表引用
  const chartRels = slideXml.match(/r:id="([^"]+)"[^>]*>([^<]*)<\/p:chart>/g) ||
                   slideXml.match(/<p:graphicFrame[^>]*r:id="([^"]+)"[^>]*>/g);

  if (!chartRels) return charts;

  for (const chartRef of chartRels) {
    const idMatch = chartRef.match(/r:id="([^"]+)"/);
    if (!idMatch) continue;

    const relId = idMatch[1];
    const chartPath = chartMap[relId] || relMap[relId];

    if (!chartPath) continue;

    try {
      // 读取图表数据文件
      const chartFullPath = `ppt/${chartPath.replace('../', '')}`;
      const chartXml = await zip.file(chartFullPath)?.async('text');

      if (chartXml) {
        const chartData = extractChartData(chartXml);
        if (chartData) {
          charts.push(chartData);
        }
      }
    } catch (e) {
      console.warn('Failed to parse chart:', e);
    }
  }

  return charts;
}

/**
 * 从图表 XML 提取数据
 */
function extractChartData(chartXml: string): ChartData | null {
  try {
    // 提取图表类型
    let chartType = 'bar';
    if (chartXml.includes('<c:barChart>')) chartType = 'bar';
    else if (chartXml.includes('<c:lineChart>')) chartType = 'line';
    else if (chartXml.includes('<c:pieChart>')) chartType = 'pie';
    else if (chartXml.includes('<c:areaChart>')) chartType = 'area';
    else if (chartXml.includes('<c:colChart>')) chartType = 'column';

    // 提取标题
    const titleMatch = chartXml.match(/<c:title[^>]*><c:tx[^>]*><c:rich[^>]*>([^<]+)<\/c:rich>/);
    const title = titleMatch ? titleMatch[1] : '图表';

    // 提取分类（X轴）
    const categories: string[] = [];
    const catMatches = chartXml.match(/<c:cat[^>]*><c:ptCount[^>]*\/>/g);
    if (catMatches) {
      const valMatches = chartXml.match(/<c:v>([^<]+)<\/c:v>/g);
      if (valMatches) {
        for (const m of valMatches.slice(0, 10)) {
          const val = m.match(/<c:v>([^<]+)<\/c:v>/);
          if (val) categories.push(val[1]);
        }
      }
    }

    // 提取系列数据
    const series: { name: string; values: number[] }[] = [];
    const seriesMatches = chartXml.match(/<c:ser[^>]*>[\s\S]*?<\/c:ser>/g);

    if (seriesMatches) {
      for (const ser of seriesMatches) {
        const nameMatch = ser.match(/<c:tx[^>]*><c:v>([^<]+)<\/c:v>/);
        const name = nameMatch ? nameMatch[1] : '数据';

        const values: number[] = [];
        const valMatches = ser.match(/<c:v>([^<]+)<\/c:v>/g);
        if (valMatches) {
          for (const m of valMatches) {
            const val = m.match(/<c:v>([^<]+)<\/c:v>/);
            if (val) values.push(parseFloat(val[1]) || 0);
          }
        }

        series.push({ name, values });
      }
    }

    if (categories.length > 0 || series.length > 0) {
      return { type: chartType, title, categories, series };
    }
  } catch (e) {
    console.warn('extractChartData failed:', e);
  }

  return null;
}

/**
 * 解析表格数据（支持外部引用表格和内嵌表格）
 */
async function parseTables(zip: JSZip, slideXml: string, relMap: Record<string, string>, tableMap: Record<string, string> = {}): Promise<TableData[]> {
  const tables: TableData[] = [];

  // 1. 查找外部引用的表格 <p:tbl r:id="...">
  const tableRefs = slideXml.match(/<p:tbl[^>]*r:id="([^"]+)"[^>]*>/g);

  if (tableRefs) {
    for (const tableRef of tableRefs) {
      const idMatch = tableRef.match(/r:id="([^"]+)"/);
      if (!idMatch) continue;

      const relId = idMatch[1];
      const tablePath = tableMap[relId] || relMap[relId];

      if (!tablePath) continue;

      try {
        const tableFullPath = `ppt/${tablePath.replace('../', '')}`;
        const tableXml = await zip.file(tableFullPath)?.async('text');

        if (tableXml) {
          const tableData = extractTableData(tableXml);
          if (tableData) {
            tables.push(tableData);
          }
        }
      } catch (e) {
        console.warn('Failed to parse external table:', e);
      }
    }
  }

  // 2. 查找内嵌表格 <a:tbl>...</a:tbl>（直接存在于 slide XML 中）
  const embeddedTableMatches = slideXml.match(/<a:tbl[^>]*>[\s\S]*?<\/a:tbl>/g);
  if (embeddedTableMatches) {
    for (const tableXml of embeddedTableMatches) {
      const tableData = extractTableData(tableXml);
      if (tableData) {
        tables.push(tableData);
      }
    }
  }

  return tables;
}

/**
 * 从表格 XML 提取数据
 */
function extractTableData(tableXml: string): TableData | null {
  try {
    const rows: string[][] = [];

    // 提取所有行
    const rowMatches = tableXml.match(/<a:tr[^>]*>[\s\S]*?<\/a:tr>/g);
    if (!rowMatches) return null;

    for (const row of rowMatches) {
      const cells: string[] = [];
      const cellMatches = row.match(/<a:tc[^>]*>[\s\S]*?<\/a:tc>/g);

      if (cellMatches) {
        for (const cell of cellMatches) {
          // 提取单元格文本
          const textMatch = cell.match(/<a:t>([^<]*)<\/a:t>/g);
          if (textMatch) {
            const text = textMatch.map(m => m.replace(/<\/?a:t>/g, '')).join(' ');
            cells.push(text.trim());
          } else {
            cells.push('');
          }
        }
      }

      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length > 0) {
      const cols = Math.max(...rows.map(r => r.length));
      return { rows: rows.length, cols, data: rows };
    }
  } catch (e) {
    console.warn('extractTableData failed:', e);
  }

  return null;
}

/**
 * 解析批注
 */
async function parseNotes(zip: JSZip, slideIndex: number): Promise<string | undefined> {
  try {
    // 尝试查找批注文件
    const notesPath = `ppt/notesSlide${slideIndex}.xml`;
    const notesXml = await zip.file(notesPath)?.async('text');

    if (notesXml) {
      const textMatches = notesXml.match(/<a:t>([^<]+)<\/a:t>/g);
      if (textMatches) {
        return textMatches.map(m => m.replace(/<\/?a:t>/g, '')).join('\n');
      }
    }
  } catch (e) {
    // 忽略
  }
  return undefined;
}

/**
 * 解析图像（支持外部引用图像和内嵌图像）
 * 提取图像的 base64 数据和位置信息
 */
async function parseImages(zip: JSZip, slideXml: string, slideIndex: number, relMap: Record<string, string>): Promise<ImageData[]> {
  const images: ImageData[] = [];

  // 构建 slide 专用的 rel map（从 slide XML 中获取）
  const slideRelsPath = `ppt/slides/_rels/slide${slideIndex}.xml.rels`;
  let slideRelMap: Record<string, string> = { ...relMap };

  try {
    const slideRelsXml = await zip.file(slideRelsPath)?.async('text');
    if (slideRelsXml) {
      const relMatches = slideRelsXml.match(/<Relationship\s+[^>]*>/g) || [];
      for (const match of relMatches) {
        const idMatch = match.match(/Id="([^"]+)"/);
        const targetMatch = match.match(/Target="([^"]+)"/);
        if (idMatch && targetMatch) {
          slideRelMap[idMatch[1]] = targetMatch[1];
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load slide rels:', e);
  }

  // 1. 查找外部引用的图像 <p:pic> 或 <p:blip r:embed="...">
  // <p:pic> 中包含 <a:blip r:embed="rIdX"/> 来引用关系
  const picMatches = slideXml.match(/<p:pic[^>]*>[\s\S]*?<\/p:pic>/g) || [];
  // 直接的 <p:blip r:embed="..."> 引用（不在 <p:pic> 内）
  const blipMatches = slideXml.match(/<p:blip\s+[^>]*r:embed="([^"]+)"[^>]*>/g) || [];
  // 外部链接 <p:blip r:link="...">
  const blipLinkMatches = slideXml.match(/<p:blip\s+[^>]*r:link="([^"]+)"[^>]*>/g) || [];

  // 处理 <p:pic> 元素 - 从内部的 <a:blip r:embed="..."> 获取关系 ID
  for (const picXml of picMatches) {
    // 在 <p:pic> 内部查找 <a:blip r:embed="...">
    const blipEmbedMatch = picXml.match(/<a:blip\s+[^>]*r:embed="([^"]+)"[^>]*>/);
    if (!blipEmbedMatch) continue;

    const relId = blipEmbedMatch[1];
    let imagePath = slideRelMap[relId];

    if (imagePath) {
      // 确保路径格式正确
      if (imagePath.startsWith('../')) {
        imagePath = `ppt/${imagePath.replace('../', '')}`;
      } else if (!imagePath.startsWith('ppt/')) {
        imagePath = `ppt/${imagePath}`;
      }

      // 提取图像位置信息
      const offMatch = picXml.match(/<a:off\s+[^>]*x="([^"]+)"\s+y="([^"]+)"/);
      const extMatch = picXml.match(/<a:ext\s+[^>]*cx="([^"]+)"\s+cy="([^"]+)"/);

      const image: ImageData = {
        id: relId,
        name: `image_${relId}`,
        originalPath: imagePath,
        position: {
          x: offMatch ? parseFloat(offMatch[1]) / 914400 : 0,
          y: offMatch ? parseFloat(offMatch[2]) / 914400 : 0,
          cx: extMatch ? parseFloat(extMatch[1]) / 914400 : 0,
          cy: extMatch ? parseFloat(extMatch[2]) / 914400 : 0,
        },
      };

      // 尝试提取 base64 数据
      const base64Data = await extractImageBase64(zip, imagePath);
      if (base64Data) {
        image.base64 = base64Data;
      }

      images.push(image);
    }
  }

  // 处理直接的 <p:blip r:embed="..."> 引用（不在 <p:pic> 内）
  for (const blip of blipMatches) {
    const embedMatch = blip.match(/r:embed="([^"]+)"/);
    if (!embedMatch) continue;

    const relId = embedMatch[1];
    // 跳过已经在 <p:pic> 中处理过的
    if (images.some(img => img.id === relId)) continue;

    let imagePath = slideRelMap[relId];

    if (imagePath) {
      // 确保路径格式正确
      if (imagePath.startsWith('../')) {
        imagePath = `ppt/${imagePath.replace('../', '')}`;
      } else if (!imagePath.startsWith('ppt/')) {
        imagePath = `ppt/${imagePath}`;
      }

      const image: ImageData = {
        id: relId,
        name: `image_${relId}`,
        originalPath: imagePath,
        position: { x: 0, y: 0, cx: 0, cy: 0 },
      };

      // 尝试提取 base64 数据
      const base64Data = await extractImageBase64(zip, imagePath);
      if (base64Data) {
        image.base64 = base64Data;
      }

      images.push(image);
    }
  }

  // 处理 <p:blip r:link="..."> 外部链接图像（无法提取数据）
  for (const blip of blipLinkMatches) {
    const linkMatch = blip.match(/r:link="([^"]+)"/);
    if (!linkMatch) continue;

    const relId = linkMatch[1];
    if (images.some(img => img.id === relId)) continue;

    const imagePath = slideRelMap[relId];

    if (imagePath) {
      const image: ImageData = {
        id: relId,
        name: `external_image_${relId}`,
        originalPath: imagePath,
        position: { x: 0, y: 0, cx: 0, cy: 0 },
        placeholder: `外部链接图像: ${imagePath}`,
      };
      images.push(image);
    }
  }

  return images;
}

/**
 * 从 PPTX 中提取图像的 base64 数据
 */
async function extractImageBase64(zip: JSZip, imagePath: string): Promise<string | undefined> {
  try {
    const imageFile = zip.file(imagePath);
    if (!imageFile) {
      console.warn(`Image file not found: ${imagePath}`);
      return undefined;
    }

    const imageBuffer = await imageFile.async('arraybuffer');
    const base64 = Buffer.from(imageBuffer).toString('base64');

    // 根据文件扩展名确定 MIME 类型
    const ext = imagePath.toLowerCase().split('.').pop();
    let mimeType = 'image/png'; // 默认
    if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'bmp') mimeType = 'image/bmp';
    else if (ext === 'tiff' || ext === 'tif') mimeType = 'image/tiff';
    else if (ext === 'svg') mimeType = 'image/svg+xml';
    else if (ext === 'webp') mimeType = 'image/webp';

    return `data:${mimeType};base64,${base64}`;
  } catch (e) {
    console.warn(`Failed to extract image base64 from ${imagePath}:`, e);
    return undefined;
  }
}

/**
 * 解析单个幻灯片
 */
function parseSlide(slideXml: string, index: number): ParsedSlide {
  const slide: ParsedSlide = {
    index,
    title: '',
    elements: [],
  };

  // Extract title from slide
  const titleMatch = slideXml.match(/<a:t>([^<]+)<\/a:t>/);
  if (titleMatch) {
    slide.title = titleMatch[1];
  }

  // Extract all text content
  const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
  const textContent = textMatches.map((match) =>
    match.replace(/<a:t>|<\/a:t>/g, '')
  );

  // Filter out title from content if it exists
  const content = textContent.filter(
    (text, idx) => idx !== 0 || text !== slide.title
  );

  // Add text elements
  if (content.length > 0) {
    slide.elements.push({
      type: 'text',
      content: content.join('\n'),
    });
  }

  return slide;
}

/**
 * 将解析结果转换为带格式的文本（用于 AI 处理）
 */
export function parsedPPTToMarkdown(parsed: ParsedPPT): string {
  const lines: string[] = [];

  for (const slide of parsed.slides) {
    // 标题
    if (slide.title) {
      lines.push(`## ${slide.title}`);
    }

    // 批注
    if (slide.notes) {
      lines.push(`**批注**: ${slide.notes}`);
    }

    // 表格
    if (slide.tables && slide.tables.length > 0) {
      for (const table of slide.tables) {
        lines.push('\n**表格**:');
        for (const row of table.data) {
          lines.push('| ' + row.join(' | ') + ' |');
        }
      }
    }

    // 图表
    if (slide.charts && slide.charts.length > 0) {
      for (const chart of slide.charts) {
        lines.push(`\n**图表 [${chart.type}]**: ${chart.title}`);
        lines.push('- 分类: ' + chart.categories.join(', '));
        for (const ser of chart.series) {
          lines.push(`- ${ser.name}: ${ser.values.join(', ')}`);
        }
      }
    }

    // 图像
    if (slide.images && slide.images.length > 0) {
      for (const img of slide.images) {
        if (img.placeholder) {
          lines.push(`\n**图片**: ${img.placeholder}`);
        } else {
          lines.push(`\n**图片**: ${img.name} (位置: x=${img.position.x.toFixed(2)}, y=${img.position.y.toFixed(2)}, 尺寸: ${img.position.cx.toFixed(2)}x${img.position.cy.toFixed(2)})`);
        }
      }
    }

    // 文本内容
    for (const el of slide.elements) {
      if (el.type === 'text' && el.content) {
        lines.push(el.content);
      }
    }

    lines.push(''); // Empty line between slides
  }

  return lines.join('\n');
}

export function extractedTextToString(parsedPPT: ParsedPPT): string {
  return parsedPPTToMarkdown(parsedPPT);
}
