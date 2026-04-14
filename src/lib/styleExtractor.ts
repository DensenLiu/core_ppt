import JSZip from 'jszip';
import type { StyleConfig, PPTStyle } from '@/types/ppt';
import { getOutputPath } from './fileUtils';
import fs from 'fs/promises';
import path from 'path';

/**
 * 提取的背景图片信息
 */
export interface ExtractedBackgroundImage {
  path: string;       // 保存的路径
  originalPath: string; // PPTX内的原始路径
  embedId: string;     // 关系ID
}

/**
 * 从 PPTX 文件中提取背景图片
 */
export async function extractBackgroundImageFromPPTX(filePath: string): Promise<ExtractedBackgroundImage | null> {
  console.log('[StyleExtractor] Extracting background image from:', filePath);

  try {
    const fileBuffer = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(fileBuffer);

    // 读取第一张幻灯片
    const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('text');
    if (!slide1) {
      console.log('[StyleExtractor] slide1.xml not found');
      return null;
    }

    // 读取第一张幻灯片的关系文件
    const slide1Rels = await zip.file('ppt/slides/_rels/slide1.xml.rels')?.async('text');
    if (!slide1Rels) {
      console.log('[StyleExtractor] slide1.xml.rels not found');
      return null;
    }

    // 解析关系文件，建立 ID -> 图片路径 的映射
    const relMatch = slide1Rels.match(/Id="([^"]+)"[^>]*Target="([^"]+)"/g);
    const imageMap: Record<string, string> = {};
    if (relMatch) {
      for (const rel of relMatch) {
        const idMatch = rel.match(/Id="([^"]+)"/);
        const targetMatch = rel.match(/Target="([^"]+)"/);
        if (idMatch && targetMatch) {
          const id = idMatch[1];
          let target = targetMatch[1];
          if (target.startsWith('../media/')) {
            target = 'ppt/media/' + target.replace('../media/', '');
          }
          imageMap[id] = target;
        }
      }
    }

    // 查找 blipFill 背景图片
    const blipMatch = slide1.match(/<p:blipFill>[\s\S]*?<a:blip[^>]*r:embed="([^"]+)"[^>]*>[\s\S]*?<\/p:blipFill>/);

    // 如果没找到 blipFill，尝试查找全尺寸图片
    let embedId = blipMatch?.[1];
    if (!embedId) {
      // 查找全尺寸的 p:pic 元素 (位置 0,0)
      const picMatch = slide1.match(/<p:pic>[\s\S]*?<a:off x="0" y="0"\/>[\s\S]*?<a:ext[^>]*cx="12195175"[^>]*cy="6858000"[\s\S]*?<\/p:pic>/);
      if (picMatch) {
        const embedMatch = picMatch[0].match(/r:embed="([^"]+)"/);
        embedId = embedMatch?.[1];
      }
    }

    if (!embedId) {
      console.log('[StyleExtractor] No background image found in slide1');
      return null;
    }

    const imagePath = imageMap[embedId];
    if (!imagePath) {
      console.log('[StyleExtractor] Image path not found for embed ID:', embedId);
      return null;
    }

    // 提取图片
    const imageData = await zip.file(imagePath)?.async('nodebuffer');
    if (!imageData) {
      console.log('[StyleExtractor] Failed to read image data');
      return null;
    }

    // 保存到 output 目录
    const outputDir = getOutputPath('');
    await fs.mkdir(outputDir, { recursive: true });

    // 根据原始文件名确定扩展名
    const ext = imagePath.includes('.png') ? '.png' : '.jpg';
    const bgFileName = `bg_template_${Date.now()}${ext}`;
    const bgFilePath = path.join(outputDir, bgFileName);
    await fs.writeFile(bgFilePath, imageData);

    console.log('[StyleExtractor] Background image extracted to:', bgFilePath);

    return {
      path: bgFilePath,
      originalPath: imagePath,
      embedId: embedId,
    };
  } catch (error) {
    console.error('[StyleExtractor] Failed to extract background image:', error);
    return null;
  }
}

/**
 * 从 PPTX 文件中提取样式配置
 */
export async function extractStyleFromPPTX(filePath: string): Promise<StyleConfig> {
  console.log('[StyleExtractor] Starting extraction for:', filePath);

  const fs = await import('fs/promises');
  const fileBuffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const style: StyleConfig = {
    themeColor: '4472C4', // Default blue
    fontFamily: 'Microsoft YaHei',
    titleFontSize: 32,
    bodyFontSize: 14,
    backgroundColor: 'FFFFFF',
    textColor: '2D3748',
    hasTopBar: false,
    topBarColor: undefined,
    topBarHeight: 0,
    bulletStyle: 'dot',
  };

  // 跟踪是否有背景图片
  let hasBackgroundImage = false;

  // 检查是否有背景图片（通过blipFill或全尺寸pic）
  try {
    const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('text');
    if (slide1) {
      // 检查是否有 <p:bg><p:bgPr><a:blipFill> 背景
      if (slide1.match(/<p:bg>[\s\S]*?<a:blipFill>[\s\S]*?<\/p:bg>/)) {
        hasBackgroundImage = true;
        console.log('[StyleExtractor] Slide1 has blipFill background');
      }
      // 检查是否有全尺寸 <p:pic> 作为背景
      if (slide1.match(/<p:pic>[\s\S]*?<a:off x="0" y="0"\/>[\s\S]*?<a:ext[^>]*cx="12195175"[\s\S]*?<\/p:pic>/)) {
        hasBackgroundImage = true;
        console.log('[StyleExtractor] Slide1 has full-size picture as background');
      }
    }
  } catch (e) {
    console.log('[StyleExtractor] Failed to check background image:', e);
  }

  try {
    // 1. 从 theme1.xml 提取完整颜色方案
    const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('text');
    if (themeXml) {
      console.log('[StyleExtractor] Found theme1.xml');

      // 提取所有强调色
      const accentColors: string[] = [];
      for (let i = 1; i <= 6; i++) {
        const pattern = new RegExp(`<a:accent${i}[^>]*>[\\s\\S]*?<a:srgbClr val="([^"]+)"`, 'i');
        const match = themeXml.match(pattern);
        if (match && match[1]) {
          accentColors.push(match[1].slice(0, 6));
        }
      }

      if (accentColors.length > 0) {
        style.themeColor = accentColors[0];
        style.accentColor = accentColors[0];
        if (accentColors.length > 1) {
          style.secondaryColor = accentColors[1];
        }
        console.log('[StyleExtractor] Accent colors:', accentColors);
      }

      // 提取深色文字 dk1 和 dk2
      const dk1Match = themeXml.match(/<a:dk1>[\s\S]*?<a:srgbClr val="([^"]+)"[^>]*>/);
      if (dk1Match) {
        style.textColor = dk1Match[1].slice(0, 6);
        console.log('[StyleExtractor] DK1 (text) color:', style.textColor);
      }

      const dk2Match = themeXml.match(/<a:dk2>[\s\S]*?<a:srgbClr val="([^"]+)"[^>]*>/);
      if (dk2Match) {
        console.log('[StyleExtractor] DK2 color:', dk2Match[1]);
      }

      // 提取 lt2 (可用作浅色背景)
      const lt2Match = themeXml.match(/<a:lt2>[\s\S]*?<a:srgbClr val="([^"]+)"[^>]*>/);
      if (lt2Match) {
        console.log('[StyleExtractor] LT2 color:', lt2Match[1]);
      }

      // 提取字体 - 从 theme 的 majorFont
      const majorFontMatch = themeXml.match(/<a:majorFont[^>]*>[\s\S]*?<a:latin[^>]*typeface="([^"]+)"/);
      if (majorFontMatch && majorFontMatch[1]) {
        style.fontFamily = majorFontMatch[1];
        console.log('[StyleExtractor] Major font from theme:', style.fontFamily);
      }

      // 提取 minorFont (正文)
      const minorFontMatch = themeXml.match(/<a:minorFont[^>]*>[\s\S]*?<a:latin[^>]*typeface="([^"]+)"/);
      if (minorFontMatch && minorFontMatch[1]) {
        // 如果没有 majorFont，用 minorFont
        if (!style.fontFamily || style.fontFamily === 'Microsoft YaHei') {
          style.fontFamily = minorFontMatch[1];
          console.log('[StyleExtractor] Minor font from theme:', style.fontFamily);
        }
      }
    }

    // 2. 从 slideMaster 提取字号和装饰信息
    const slideMasterFiles = Object.keys(zip.files).filter(
      (f) => f.startsWith('ppt/slideMasters/slideMaster') && f.endsWith('.xml')
    );

    if (slideMasterFiles.length > 0) {
      const masterXml = await zip.file(slideMasterFiles[0])?.async('text');
      if (masterXml) {
        console.log('[StyleExtractor] Analyzing slideMaster:', slideMasterFiles[0]);

        // 提取所有字号
        const allSizeMatches = masterXml.matchAll(/sz="(\d{4,5})"/g);
        const sizes: number[] = [];
        for (const match of allSizeMatches) {
          const size = parseInt(match[1]) / 100;
          if (size >= 8 && size <= 60) {
            sizes.push(size);
          }
        }

        // 最大字号通常是标题
        if (sizes.length > 0) {
          const maxSize = Math.max(...sizes);
          if (maxSize >= 24 && maxSize <= 60) {
            style.titleFontSize = Math.min(48, maxSize);
            console.log('[StyleExtractor] Title font size from master:', style.titleFontSize);
          }
          // 较小字号通常是正文
          const bodySizes = sizes.filter(s => s < 24);
          if (bodySizes.length > 0) {
            style.bodyFontSize = Math.max(10, Math.min(16, Math.round(bodySizes[0])));
            console.log('[StyleExtractor] Body font size from master:', style.bodyFontSize);
          }
        }

        // 检查是否有顶部装饰条 - 通过检查背景是否为纯色引用
        const bgMatch = masterXml.match(/<p:bg>[\s\S]*?<\/p:bg>/);
        if (bgMatch) {
          const bgStr = bgMatch[0];
          // 如果是 bgRef idx="1001" 通常是主题背景色，不是装饰条
          if (bgStr.includes('bgRef idx="1001"') || bgStr.includes('bgRef idx="1002"')) {
            // 这是主题背景引用，不是顶部装饰
            style.hasTopBar = false;
            console.log('[StyleExtractor] Master uses theme background reference');
          }
          // 如果是纯色填充，可能是装饰条
          if (bgStr.includes('<a:solidFill>') && bgStr.includes('<a:srgbClr')) {
            console.log('[StyleExtractor] Master has solid fill background');
          }
        }
      }
    }

    // 3. 从实际幻灯片分析装饰元素（顶部条等）
    const slideFilesForDecorations = Object.keys(zip.files)
      .filter((f) => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'))
      .sort()
      .slice(0, 5); // 分析前5张

    for (const slideFile of slideFilesForDecorations) {
      const slideXml = await zip.file(slideFile)?.async('text');
      if (!slideXml) continue;

      // 检测顶部色条 - 查找 y=0 位置的小高度色块
      // 匹配模式: y="0" 的 shape fill
      const topShapes = slideXml.match(
        /<p:sp>[\s\S]*?<a:off x="0" y="0"[\s\S]*?<a:ext[^>]*cy="(\d+)"[\s\S]*?<a:solidFill>[\s\S]*?<a:srgbClr val="([^"]+)"[^>]*>[\s\S]*?<\/p:sp>/gi
      );

      if (topShapes) {
        for (const shape of topShapes) {
          const heightMatch = shape.match(/<a:ext[^>]*cy="(\d+)"/);
          const colorMatch = shape.match(/<a:srgbClr val="([^"]+)"/);

          if (heightMatch && colorMatch) {
            const cy = parseInt(heightMatch[1]);
            const heightInches = cy / 914400; // EMUs to inches

            // 如果高度小于 2 英寸，认为是顶部装饰条
            if (heightInches < 2 && heightInches > 0.1) {
              style.hasTopBar = true;
              style.topBarColor = colorMatch[1];
              style.topBarHeight = heightInches;
              console.log('[StyleExtractor] Found top bar - height:', heightInches.toFixed(2), 'inches, color:', style.topBarColor);
              break;
            }
          }
        }
      }

      if (style.hasTopBar) break;
    }

    // 4. 从多张幻灯片提取主要颜色（而不是只看第一张）
    const slideFiles = Object.keys(zip.files)
      .filter((f) => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'))
      .sort();

    // 收集所有 srgbClr 颜色
    const allColors: string[] = [];
    const colorCount: Record<string, number> = {};

    // 跳过第一张（通常是封面），分析后续幻灯片
    const slidesToAnalyze = slideFiles.slice(0, Math.min(10, slideFiles.length));

    for (const slideFile of slidesToAnalyze) {
      const slideXml = await zip.file(slideFile)?.async('text');
      if (!slideXml) continue;

      // 提取所有 srgbClr 颜色
      const colorMatches = slideXml.match(/<a:srgbClr val="([^"]{6,8})"/g);
      if (colorMatches) {
        for (const match of colorMatches) {
          const color = match.match(/val="([^"]+)"/)?.[1];
          if (color && /^[0-9A-Fa-f]{6}$/.test(color.slice(0, 6))) {
            allColors.push(color.slice(0, 6).toUpperCase());
            colorCount[color.slice(0, 6).toUpperCase()] = (colorCount[color.slice(0, 6).toUpperCase()] || 0) + 1;
          }
        }
      }
    }

    console.log('[StyleExtractor] All extracted colors:', colorCount);

    // 找出最常见的颜色（排除白色和太亮的颜色）
    const significantColors = Object.entries(colorCount)
      .filter(([color]) => {
        // 排除白色和极亮颜色
        const brightness = getColorBrightness(color);
        return brightness < 240 && color !== 'FFFFFF' && color !== 'F7F7F7';
      })
      .sort((a, b) => b[1] - a[1]);

    console.log('[StyleExtractor] Significant colors (excluding white):', significantColors.slice(0, 5));

    // 按亮度排序（从深到浅），排除纯黑
    const darkColors = significantColors
      .filter(([color]) => {
        const brightness = getColorBrightness(color);
        return brightness >= 20 && brightness < 180 && color !== '000000'; // 排除纯黑和太亮的
      })
      .sort((a, b) => {
        // 按亮度排序（深的在前）
        const brightnessA = getColorBrightness(a[0]);
        const brightnessB = getColorBrightness(b[0]);
        return brightnessA - brightnessB;
      });

    // 注意：不要用幻灯片颜色覆盖已经从 theme1.xml 正确提取的 themeColor
    // themeColor 应该始终保持从主题文件提取的值（accent1），幻灯片分析只用于备用

    // 如果有背景图片，不根据幻灯片内容颜色判断背景色
    // 因为幻灯片内容中的深色可能是标题或其他元素，不是背景
    if (!hasBackgroundImage) {
      // 检查是否有深色背景（亮度 < 80）
      const darkBgColors = significantColors.filter(([color]) => {
        const brightness = getColorBrightness(color);
        return brightness < 80 && color !== '000000'; // 深色但不是纯黑
      });

      if (darkBgColors.length > 0) {
        // 使用最深的非黑色作为背景
        const sortedDarkBg = darkBgColors.sort((a, b) => {
          return getColorBrightness(a[0]) - getColorBrightness(b[0]);
        });
        style.backgroundColor = sortedDarkBg[0][0];
        style.textColor = 'FFFFFF';
        console.log('[StyleExtractor] Dark background detected:', style.backgroundColor);
      } else if (significantColors.some(([c]) => c === '000000')) {
        // 有纯黑但没有深灰，用深灰代替
        style.backgroundColor = '2D2D2D';
        style.textColor = 'FFFFFF';
        console.log('[StyleExtractor] Using dark gray instead of pure black');
      }
    } else {
      console.log('[StyleExtractor] Has background image, skipping slide color analysis for background');
    }

    // 5. 从 slide layouts 提取额外样式信息
    const layoutFiles = Object.keys(zip.files).filter(
      (f) => f.startsWith('ppt/slideLayouts/slideLayout') && f.endsWith('.xml')
    );

    if (layoutFiles.length > 0 && style.titleFontSize === 32) {
      // 如果标题字号还是默认值，尝试从 layout 提取
      for (const layoutFile of layoutFiles.slice(0, 3)) {
        const layoutXml = await zip.file(layoutFile)?.async('text');
        if (layoutXml) {
          const sizeMatch = layoutXml.match(/sz="(\d{4,5})"/);
          if (sizeMatch) {
            const size = parseInt(sizeMatch[1]) / 100;
            if (size >= 20 && size <= 60) {
              style.titleFontSize = Math.max(24, Math.min(44, size));
              console.log('[StyleExtractor] Extracted title size from layout:', style.titleFontSize);
              break;
            }
          }
        }
      }
    }

  } catch (error) {
    console.warn('[StyleExtractor] Failed to extract full style, using defaults:', error);
  }

  console.log('[StyleExtractor] Final style:', style);
  return style;
}

/**
 * 将提取的样式转换为 PPTStyle 格式
 */
export function convertToPPTStyle(extractedStyle: StyleConfig): PPTStyle {
  console.log('[StyleExtractor] Converting style:', JSON.stringify(extractedStyle));

  // 确保所有值都有有效默认值
  const primary = extractedStyle.themeColor?.replace('#', '') || '4472C4';
  const background = extractedStyle.backgroundColor?.replace('#', '') || 'FFFFFF';
  const textColor = extractedStyle.textColor?.replace('#', '') || '2D3748';
  const fontFamily = extractedStyle.fontFamily || 'Microsoft YaHei';
  const titleFontSize = extractedStyle.titleFontSize || 32;
  const bodyFontSize = extractedStyle.bodyFontSize || 14;

  const isDarkBg = isDarkColor(background);

  // 根据提取的字号调整
  const titleSize = Math.min(44, Math.max(24, titleFontSize));
  const bodySize = Math.min(16, Math.max(10, bodyFontSize));

  // 是否显示顶部装饰条
  const showTopBar = extractedStyle.hasTopBar === true;
  const topBarColor = extractedStyle.topBarColor || primary;
  const topBarHeight = extractedStyle.topBarHeight || 0.8;

  console.log('[StyleExtractor] Converting - primary:', primary, 'background:', background, 'font:', fontFamily);
  console.log('[StyleExtractor] Decorations - showTopBar:', showTopBar, 'topBarColor:', topBarColor);

  return {
    id: 'reference-style',
    name: '参考样式',
    description: '从参考PPT提取的样式',
    category: 'reference',

    colors: {
      primary: primary,
      secondary: extractedStyle.secondaryColor || adjustColorBrightness(primary, 20),
      accent: extractedStyle.accentColor || adjustColorBrightness(primary, -20),
      background: background,
      text: textColor,
      textLight: isDarkBg ? 'FFFFFF' : textColor,
      titleColor: isDarkBg ? 'FFFFFF' : primary,
      subtitleColor: isDarkBg ? 'CCCCCC' : '666666',
    },

    fonts: {
      title: fontFamily,
      body: fontFamily,
    },

    sizes: {
      title: titleSize,
      subtitle: Math.round(titleSize * 0.65),
      body: bodySize,
      small: 10,
    },

    layout: {
      titleY: showTopBar ? 0.3 + topBarHeight : 0.3,
      contentY: showTopBar ? 1.0 + topBarHeight : 1.0,
      marginX: 0.5,
      marginY: 0.4,
    },

    decorations: {
      showTopBar: showTopBar,
      showBottomBar: false,
      showPageNumber: true,
      dividerStyle: 'none',
      topBarColor: topBarColor,
      topBarHeight: topBarHeight,
    },

    content: {
      bulletStyle: extractedStyle.bulletStyle || 'dot',
      lineSpacing: 1.5,
    },
  };
}

// 辅助函数：调整颜色亮度
function adjustColorBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return '4472C4';

  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

// 辅助函数：判断是否为深色
function isDarkColor(hex: string): boolean {
  if (!hex) return false;
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  if (fullHex.length < 6) return false;

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

// 辅助函数：获取颜色亮度 (0-255)
function getColorBrightness(hex: string): number {
  if (!hex) return 255;
  const cleanHex = hex.replace('#', '').toUpperCase();
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  if (fullHex.length < 6) return 255;

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * 修改生成PPT的主题色
 */
export async function applyThemeColorsToPPTX(
  pptxPath: string,
  themeColor: string,
  fontFamily: string
): Promise<void> {
  console.log('[StyleExtractor] Applying theme colors to PPTX:', { themeColor, fontFamily });

  const fsPromises = await import('fs/promises');
  const JSZipPromises = require('jszip');
  const path = require('path');

  const fileBuffer = await fsPromises.readFile(pptxPath);
  const zip = await JSZipPromises.loadAsync(fileBuffer);

  // 修改 theme1.xml
  const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('text');
  if (themeXml) {
    let modifiedTheme = themeXml;

    // 替换 accent1 颜色 (使用更精确的匹配)
    modifiedTheme = modifiedTheme.replace(
      /<a:accent1>\s*<a:srgbClr\s+val="[^"]*"/g,
      `<a:accent1><a:srgbClr val="${themeColor}"`
    );

    // 替换 accent2 颜色
    const darkerColor = adjustColorBrightness(themeColor, -20);
    modifiedTheme = modifiedTheme.replace(
      /<a:accent2>\s*<a:srgbClr\s+val="[^"]*"/g,
      `<a:accent2><a:srgbClr val="${darkerColor}"`
    );

    // 替换 majorFont 中的 latin typeface 属性
    modifiedTheme = modifiedTheme.replace(
      /(<a:majorFont[^>]*>\s*<a:latin\s+)typeface="[^"]*"/g,
      `$1typeface="${fontFamily}"`
    );

    // 替换 minorFont 中的 latin typeface 属性
    modifiedTheme = modifiedTheme.replace(
      /(<a:minorFont[^>]*>\s*<a:latin\s+)typeface="[^"]*"/g,
      `$1typeface="${fontFamily}"`
    );

    // 更新 theme 文件
    zip.file('ppt/theme/theme1.xml', modifiedTheme);
    console.log('[StyleExtractor] Theme updated');
  }

  // 保存修改后的文件
  const outputBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  await fsPromises.writeFile(pptxPath, outputBuffer);
  console.log('[StyleExtractor] PPTX file saved with new theme');
}

/**
 * 获取内置样式
 */
export function getBuiltinStyle(styleName: 'business' | 'tech' | 'simple'): StyleConfig {
  const styles: Record<string, StyleConfig> = {
    business: {
      themeColor: '1F4E78',
      fontFamily: 'Microsoft YaHei',
      backgroundColor: 'FFFFFF',
      titleFontSize: 32,
      bodyFontSize: 14,
    },
    tech: {
      themeColor: '00B050',
      fontFamily: 'Microsoft YaHei',
      backgroundColor: 'F5F5F5',
      titleFontSize: 30,
      bodyFontSize: 14,
    },
    simple: {
      themeColor: '333333',
      fontFamily: 'Microsoft YaHei',
      backgroundColor: 'FFFFFF',
      titleFontSize: 34,
      bodyFontSize: 14,
    },
  };

  return styles[styleName] || styles.business;
}
