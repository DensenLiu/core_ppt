import PptxGenJS from 'pptxgenjs';
import type { ReorganizedContent, SlideContent, StyleConfig, PPTStyle, ImageData } from '@/types/ppt';
import { getOutputPath, generateOutputFileName } from './fileUtils';
import { getStyleById } from '@/skills/pptStyles';
import { convertToPPTStyle } from './styleExtractor';
import { BUILTIN_LAYOUTS, getLayoutById, type LayoutTemplate } from '@/skills/pptLayouts';

// 图片布局结果接口
interface ImageLayoutResult {
  positions: { x: number; y: number; w: number; h: number }[];
  textBounds: {
    y: number;      // 文本起始Y坐标
    h: number;      // 文本可用高度
  };
}

// PPT 幻灯片尺寸常量 (16:9)
const SLIDE_WIDTH = 10;
const SLIDE_HEIGHT = 5.625;
const MARGIN = 0.3;
const TITLE_HEIGHT = 1.0;

export async function generatePPTX(
  content: ReorganizedContent,
  styleId: string,
  originalFileName: string,
  extractedStyle?: StyleConfig,
  backgroundImagePath?: string
): Promise<{ filePath: string; fileName: string; pageCount: number }> {
  console.log('[Generate] styleId:', styleId);
  console.log('[Generate] extractedStyle:', extractedStyle);
  console.log('[Generate] backgroundImagePath:', backgroundImagePath);

  // 获取样式配置
  let style: PPTStyle;

  if (styleId === 'reference-style' && extractedStyle) {
    // 使用从参考PPT提取的样式
    style = convertToPPTStyle(extractedStyle);
    console.log('[Generate] Using extracted reference style:', style);
  } else {
    // 使用内置样式
    style = getStyleById(styleId) || getStyleById('business-blue')!;
    console.log('[Generate] Using builtin style:', style.id);
  }

  const pres = new PptxGenJS();

  // Set presentation properties
  pres.layout = 'LAYOUT_16x9';
  pres.title = content.slides[0]?.title || '精简PPT';
  pres.author = 'PPT智能助手';

  // 预定义颜色
  const primaryHex = '#' + style.colors.primary;
  const secondaryHex = '#' + style.colors.secondary;
  const bgHex = '#' + style.colors.background;
  const textHex = style.colors.text;
  const titleColor = style.colors.titleColor || (isDarkColor(style.colors.background) ? 'FFFFFF' : style.colors.primary);
  const subtitleColor = style.colors.subtitleColor || (isDarkColor(style.colors.background) ? 'CCCCCC' : '666666');

  // 判断是否为深色背景
  const isDarkBg = isDarkColor(style.colors.background);

  // 装饰配置
  const showTopBar = style.decorations?.showTopBar ?? false;
  const topBarColor = style.decorations?.topBarColor || primaryHex;
  const topBarHeight = style.decorations?.topBarHeight || 0.8;

  // 使用样式中的字号配置
  const titleSize = style.sizes.title || 32;
  const subtitleSize = style.sizes.subtitle || 20;
  const bodySize = style.sizes.body || 14;
  const smallSize = style.sizes.small || 10;

  console.log('[Generate] Style colors:', {
    primary: primaryHex,
    background: bgHex,
    text: textHex,
    titleColor: titleColor,
    subtitleColor: subtitleColor,
    isDarkBg
  });
  console.log('[Generate] Decorations:', { showTopBar, topBarColor, topBarHeight });
  console.log('[Generate] Font sizes:', { titleSize, subtitleSize, bodySize, smallSize });

  // Generate slides
  const hasBgImage = !!backgroundImagePath;

  for (let i = 0; i < content.slides.length; i++) {
    const slideContent = content.slides[i];
    console.log(`[Generate] Slide ${i + 1}:`, slideContent.title, 'layout:', slideContent.layout);

    const slide = pres.addSlide();

    // 如果有背景图片，先添加背景图片
    if (hasBgImage) {
      console.log('[Generate] Adding background image:', backgroundImagePath);
      try {
        slide.background = { path: backgroundImagePath! };
      } catch (bgError) {
        console.error('[Generate] Failed to add background image:', bgError);
        // 回退到纯色背景
        slide.addShape('rect', {
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          fill: { color: bgHex },
        });
      }
    }

    // 根据内容选择合适的布局模板
    const selectedLayout = selectLayoutForContent(slideContent);
    const contentItems = slideContent.content || [];
    const slideImages = slideContent.images || [];

    console.log(`[Generate] Slide ${i + 1}: using layout "${selectedLayout.name}"`);

    // 特殊布局类型直接使用对应的渲染函数
    const layoutType = slideContent.layout || 'content';

    if (layoutType === 'cover') {
      renderCoverSlide(slide, slideContent.title, contentItems, style, primaryHex, bgHex, isDarkBg, titleSize, subtitleSize, bodySize, hasBgImage, showTopBar, topBarColor, topBarHeight, titleColor, subtitleColor);
    } else if (layoutType === 'transition') {
      renderTransitionSlide(slide, slideContent.title, slideContent.transitionTo, style, primaryHex, titleSize, hasBgImage, showTopBar, topBarColor, titleColor);
    } else if (layoutType === 'table' && slideContent.table) {
      renderTableSlide(slide, slideContent.title, slideContent.table, style, primaryHex, textHex, isDarkBg, bgHex, titleSize, bodySize, hasBgImage, showTopBar, topBarColor, topBarHeight, titleColor);
    } else if (layoutType === 'chart' && slideContent.chart) {
      renderChartSlide(slide, slideContent.title, slideContent.chart, style, primaryHex, textHex, isDarkBg, bgHex, titleSize, bodySize, hasBgImage, showTopBar, topBarColor, topBarHeight, titleColor);
    } else {
      // 使用布局模板渲染，返回是否在布局内放置了图片
      const imagesPlacedInLayout = renderSlideWithLayout(
        slide, slideContent, selectedLayout, style,
        primaryHex, textHex, isDarkBg, bgHex,
        titleSize, bodySize,
        showTopBar, topBarColor, topBarHeight, titleColor
      );

      // 只有当布局中没有放置图片时，才在底部添加图片（兼容没有image区域的旧布局）
      if (slideImages.length > 0 && !imagesPlacedInLayout) {
        renderImagesAtBottom(slide, slideImages, style);
      }
    }

    // 页码
    if (style.decorations?.showPageNumber) {
      const pageNumColor = isDarkBg ? 'CCCCCC' : '999999';
      slide.addText(`${i + 1} / ${content.slides.length}`, {
        x: '90%',
        y: '95%',
        w: '10%',
        h: 0.3,
        fontSize: smallSize,
        fontFace: style.fonts.body,
        color: pageNumColor,
        align: 'right',
      });
    }

    // 演讲备注
    if (slideContent.notes) {
      slide.addNotes(slideContent.notes);
    }
  }

  // Generate file
  const fileName = generateOutputFileName(originalFileName);
  const outputPath = getOutputPath(fileName);

  await pres.writeFile({ fileName: outputPath });

  return {
    filePath: outputPath,
    fileName,
    pageCount: content.slides.length,
  };
}

/**
 * 渲染封面页
 */
function renderCoverSlide(
  slide: PptxGenJS.Slide,
  title: string,
  content: string[],
  style: PPTStyle,
  primaryHex: string,
  bgHex: string,
  isDarkBg: boolean,
  titleSize: number,
  subtitleSize: number,
  bodySize: number,
  hasBackgroundImage: boolean = false,
  showTopBar: boolean = false,
  topBarColor: string = '',
  topBarHeight: number = 0.8,
  titleColor: string = 'FFFFFF',
  subtitleColor: string = 'CCCCCC'
) {
  const marginX = style.layout.marginX;

  // 背景 - 如果没有背景图片才添加纯色背景
  if (!hasBackgroundImage) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: bgHex },
    });
  }

  // 顶部装饰条 - 根据样式决定是否添加
  if (showTopBar) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: topBarHeight,
      fill: { color: topBarColor },
    });
  }

  // 主标题 - 使用配置的标题颜色
  slide.addText(title, {
    x: marginX,
    y: showTopBar ? 1.5 : 1.4,
    w: '88%',
    h: 1.2,
    fontSize: titleSize,
    fontFace: style.fonts.title,
    color: titleColor,
    bold: true,
    align: 'center',
  });

  // 副标题（从内容中取前3条）
  const subtitle = content.slice(0, 3).join('\n');
  if (subtitle) {
    slide.addText(subtitle, {
      x: marginX,
      y: showTopBar ? 2.9 : 2.8,
      w: '88%',
      h: 1.5,
      fontSize: subtitleSize - 2,
      fontFace: style.fonts.body,
      color: subtitleColor,
      align: 'center',
      lineSpacing: 30,
    });
  }
}

/**
 * 渲染过渡页
 */
function renderTransitionSlide(
  slide: PptxGenJS.Slide,
  title: string,
  transitionTo: string | undefined,
  style: PPTStyle,
  primaryHex: string,
  titleSize: number,
  hasBackgroundImage: boolean = false,
  showTopBar: boolean = false,
  topBarColor: string = '',
  titleColor: string = 'FFFFFF'
) {
  // 简洁背景 - 如果没有背景图片才添加
  if (!hasBackgroundImage) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: primaryHex },
    });
  }

  // 过渡标题
  slide.addText(title, {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1,
    fontSize: titleSize,
    fontFace: style.fonts.title,
    color: titleColor,
    bold: true,
    align: 'center',
  });

  // 过渡到
  if (transitionTo) {
    slide.addText(`> ${transitionTo}`, {
      x: 0.5,
      y: 3.2,
      w: '90%',
      h: 0.5,
      fontSize: 18,
      fontFace: style.fonts.body,
      color: titleColor,
      align: 'center',
    });
  }
}

/**
 * 渲染内容页
 */
function renderContentSlide(
  slide: PptxGenJS.Slide,
  title: string,
  content: string[],
  style: PPTStyle,
  primaryHex: string,
  textHex: string,
  isDarkBg: boolean,
  bgHex: string,
  titleSize: number,
  bodySize: number,
  hasBackgroundImage: boolean = false,
  showTopBar: boolean = false,
  topBarColor: string = '',
  topBarHeight: number = 0.8,
  titleColor: string = 'FFFFFF',
  imageLayout?: ImageLayoutResult
) {
  const marginX = style.layout.marginX;
  const contentColor = isDarkBg ? 'FFFFFF' : textHex;
  const actualTopBarHeight = showTopBar ? topBarHeight : 0;

  // 背景 - 如果没有背景图片才添加纯色背景
  if (!hasBackgroundImage) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: bgHex },
    });
  }

  // 顶部装饰条 - 根据样式决定是否添加
  if (showTopBar) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: topBarHeight,
      fill: { color: topBarColor },
    });
  }

  // 标题 - 使用配置的字号和颜色
  slide.addText(title, {
    x: marginX,
    y: 0.15 + actualTopBarHeight,
    w: '88%',
    h: 0.65,
    fontSize: titleSize - 4, // 标题比封面小一点
    fontFace: style.fonts.title,
    color: showTopBar ? 'FFFFFF' : titleColor, // 有顶部条时用白色
    bold: true,
  });

  // 计算文本区域（如果有图片，动态调整）
  let textY: number;
  let textH: number;
  if (imageLayout) {
    textY = imageLayout.textBounds.y;
    textH = imageLayout.textBounds.h;
  } else {
    textY = 1.1 + actualTopBarHeight;
    textH = 4.8 - actualTopBarHeight;
  }

  // 内容文字处理 - 使用配置的字号
  if (content.length > 0) {
    // 计算每条内容的显示
    const contentText = content.map(item => `• ${item}`).join('\n');

    slide.addText(contentText, {
      x: marginX,
      y: textY,
      w: '88%',
      h: textH,
      fontSize: bodySize, // 使用配置的字号
      fontFace: style.fonts.body,
      color: contentColor,
      lineSpacing: 28, // 行距
      bullet: false, // 已经手动添加了 bullet
      autoFit: true, // 自动缩小字体防止溢出
      valign: 'top', // 文本顶部对齐
    });
  }
}

/**
 * 渲染表格页
 */
function renderTableSlide(
  slide: PptxGenJS.Slide,
  title: string,
  table: SlideContent['table'],
  style: PPTStyle,
  primaryHex: string,
  textHex: string,
  isDarkBg: boolean,
  bgHex: string,
  titleSize: number,
  bodySize: number,
  hasBackgroundImage: boolean = false,
  showTopBar: boolean = false,
  topBarColor: string = '',
  topBarHeight: number = 0.8,
  titleColor: string = 'FFFFFF'
) {
  const marginX = style.layout.marginX;
  const contentColor = isDarkBg ? 'FFFFFF' : textHex;
  const actualTopBarHeight = showTopBar ? topBarHeight : 0;

  // 背景 - 如果没有背景图片才添加纯色背景
  if (!hasBackgroundImage) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: bgHex },
    });
  }

  // 顶部装饰条 - 根据样式决定是否添加
  if (showTopBar) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: topBarHeight,
      fill: { color: topBarColor },
    });
  }

  // 标题
  slide.addText(title, {
    x: marginX,
    y: 0.15 + actualTopBarHeight,
    w: '88%',
    h: 0.65,
    fontSize: titleSize - 4,
    fontFace: style.fonts.title,
    color: showTopBar ? 'FFFFFF' : titleColor,
    bold: true,
  });

  // 绘制表格
  if (table && table.headers && table.rows) {
    const tableData: any[][] = table.rows.map(row => [...row]);

    slide.addTable(tableData, {
      x: marginX,
      y: 1.0,
      w: '88%',
      h: 4.5,
      fontFace: style.fonts.body,
      fontSize: bodySize - 2,
      color: contentColor,
      border: { type: 'solid', pt: 0.5, color: isDarkBg ? '444444' : 'CCCCCC' },
      fill: { color: isDarkBg ? '#2A2A4E' : 'FFFFFF' },
      align: 'center',
      valign: 'middle',
    });
  }
}

/**
 * 渲染图表页
 */
function renderChartSlide(
  slide: PptxGenJS.Slide,
  title: string,
  chart: SlideContent['chart'],
  style: PPTStyle,
  primaryHex: string,
  textHex: string,
  isDarkBg: boolean,
  bgHex: string,
  titleSize: number,
  bodySize: number,
  hasBackgroundImage: boolean = false,
  showTopBar: boolean = false,
  topBarColor: string = '',
  topBarHeight: number = 0.8,
  titleColor: string = 'FFFFFF'
) {
  const marginX = style.layout.marginX;
  const contentColor = isDarkBg ? 'FFFFFF' : textHex;
  const actualTopBarHeight = showTopBar ? topBarHeight : 0;

  // 背景 - 如果没有背景图片才添加纯色背景
  if (!hasBackgroundImage) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: bgHex },
    });
  }

  // 顶部装饰条 - 根据样式决定是否添加
  if (showTopBar) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: topBarHeight,
      fill: { color: topBarColor },
    });
  }

  // 标题
  slide.addText(title, {
    x: marginX,
    y: 0.15 + actualTopBarHeight,
    w: '88%',
    h: 0.65,
    fontSize: titleSize - 4,
    fontFace: style.fonts.title,
    color: showTopBar ? 'FFFFFF' : titleColor,
    bold: true,
  });

  // 绘制图表（用数据表格模拟）
  if (chart && chart.categories && chart.series) {
    const tableData: any[][] = chart.categories.map((cat, idx) => {
      return [cat, ...chart.series.map(s => String(s.values[idx] || 0))];
    });

    slide.addTable(tableData, {
      x: marginX,
      y: 1.0,
      w: '88%',
      h: 4.0,
      fontFace: style.fonts.body,
      fontSize: bodySize - 1,
      color: contentColor,
      border: { type: 'solid', pt: 0.5, color: isDarkBg ? '444444' : 'CCCCCC' },
      fill: { color: isDarkBg ? '#2A2A4E' : 'FFFFFF' },
      align: 'center',
      valign: 'middle',
    });
  }
}

/**
 * 渲染列表页
 */
function renderListSlide(
  slide: PptxGenJS.Slide,
  title: string,
  listItems: { title: string; content: string; highlight?: boolean }[],
  style: PPTStyle,
  primaryHex: string,
  textHex: string,
  isDarkBg: boolean,
  bgHex: string,
  titleSize: number,
  bodySize: number,
  hasBackgroundImage: boolean = false,
  showTopBar: boolean = false,
  topBarColor: string = '',
  topBarHeight: number = 0.8,
  titleColor: string = 'FFFFFF'
) {
  const marginX = style.layout.marginX;
  const contentColor = isDarkBg ? 'FFFFFF' : textHex;
  const actualTopBarHeight = showTopBar ? topBarHeight : 0;

  // 背景 - 如果没有背景图片才添加纯色背景
  if (!hasBackgroundImage) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: bgHex },
    });
  }

  // 顶部装饰条 - 根据样式决定是否添加
  if (showTopBar) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: topBarHeight,
      fill: { color: topBarColor },
    });
  }

  // 标题
  slide.addText(title, {
    x: marginX,
    y: 0.15 + actualTopBarHeight,
    w: '88%',
    h: 0.65,
    fontSize: titleSize - 4,
    fontFace: style.fonts.title,
    color: showTopBar ? 'FFFFFF' : titleColor,
    bold: true,
  });

  // 列表项
  let yPos = 1.0 + actualTopBarHeight;
  const itemHeight = 0.55;

  listItems.forEach((item, idx) => {
    if (yPos > 5.0) return;

    // 高亮背景
    if (item.highlight) {
      slide.addShape('rect', {
        x: marginX,
        y: yPos,
        w: '88%',
        h: itemHeight,
        fill: { color: isDarkBg ? '#3A3A5E' : '#F0F7FF' },
      });
    }

    // 项目标题
    slide.addText(`• ${item.title}`, {
      x: marginX,
      y: yPos,
      w: '88%',
      h: itemHeight * 0.45,
      fontSize: bodySize,
      fontFace: style.fonts.title,
      color: item.highlight ? primaryHex : contentColor,
      bold: true,
    });

    // 描述
    if (item.content) {
      slide.addText(item.content, {
        x: marginX + 0.2,
        y: yPos + itemHeight * 0.45,
        w: '85%',
        h: itemHeight * 0.45,
        fontSize: bodySize - 2,
        fontFace: style.fonts.body,
        color: isDarkBg ? 'CCCCCC' : '666666',
      });
    }

    yPos += itemHeight;
  });
}

/**
 * 渲染双栏页
 */
function renderTwoColumnSlide(
  slide: PptxGenJS.Slide,
  title: string,
  content: string[],
  style: PPTStyle,
  primaryHex: string,
  textHex: string,
  isDarkBg: boolean,
  bgHex: string,
  titleSize: number,
  bodySize: number,
  hasBackgroundImage: boolean = false,
  showTopBar: boolean = false,
  topBarColor: string = '',
  topBarHeight: number = 0.8,
  titleColor: string = 'FFFFFF'
) {
  const marginX = style.layout.marginX;
  const contentColor = isDarkBg ? 'FFFFFF' : textHex;
  const actualTopBarHeight = showTopBar ? topBarHeight : 0;

  // 背景 - 如果没有背景图片才添加纯色背景
  if (!hasBackgroundImage) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: bgHex },
    });
  }

  // 顶部装饰条 - 根据样式决定是否添加
  if (showTopBar) {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: topBarHeight,
      fill: { color: topBarColor },
    });
  }

  // 标题
  slide.addText(title, {
    x: marginX,
    y: 0.15 + actualTopBarHeight,
    w: '88%',
    h: 0.65,
    fontSize: titleSize - 4,
    fontFace: style.fonts.title,
    color: showTopBar ? 'FFFFFF' : titleColor,
    bold: true,
  });

  // 双栏内容
  const leftContent = content.slice(0, Math.ceil(content.length / 2));
  const rightContent = content.slice(Math.ceil(content.length / 2));

  // 左侧
  slide.addText(leftContent.map(item => `• ${item}`).join('\n'), {
    x: marginX,
    y: 1.0 + actualTopBarHeight,
    w: '43%',
    h: 4.5 - actualTopBarHeight,
    fontSize: bodySize - 1,
    fontFace: style.fonts.body,
    color: contentColor,
    lineSpacing: 26,
  });

  // 右侧
  slide.addText(rightContent.map(item => `• ${item}`).join('\n'), {
    x: marginX + 0.3,
    y: 1.0,
    w: '43%',
    h: 4.5,
    fontSize: bodySize - 1,
    fontFace: style.fonts.body,
    color: contentColor,
    lineSpacing: 26,
  });

  // 中间分隔线
  slide.addShape('line', {
    x: '50%',
    y: 1.0,
    w: 0,
    h: 4.5,
    line: { color: isDarkBg ? '444444' : 'DDDDDD', width: 1 },
  });
}

// 判断是否为深色
function isDarkColor(hex: string): boolean {
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

/**
 * 根据内容特征选择合适的布局模板
 */
function selectLayoutForContent(slideContent: SlideContent): LayoutTemplate {
  const contentItems = slideContent.content || [];
  const contentCount = contentItems.length;
  const layout = slideContent.layout || 'content';
  const hasImages = (slideContent.images?.length || 0) > 0;

  // 如果用户明确指定了布局，尝试使用对应的模板
  if (layout && layout !== 'content') {
    const template = getLayoutById(layout);
    if (template) return template;
  }

  // 根据内容数量和是否有图片选择布局
  if (hasImages) {
    // 有图片时，图片作为独立内容区，内容区相应减少
    if (contentCount <= 3) {
      return getLayoutById('left-top-right-bottom')!; // 左上文右下图
    }
    return getLayoutById('two-column')!;
  }

  // 无图片时，根据内容数量选择
  if (contentCount <= 3) {
    return getLayoutById('single-column')!;
  } else if (contentCount <= 6) {
    return getLayoutById('two-column')!;
  } else {
    return getLayoutById('three-column')!;
  }
}

/**
 * 使用布局模板渲染幻灯片
 * 图片作为内容的一部分，占据独立区域
 * 返回是否在布局内放置了图片
 */
function renderSlideWithLayout(
  slide: PptxGenJS.Slide,
  slideContent: SlideContent,
  layout: LayoutTemplate,
  style: PPTStyle,
  primaryHex: string,
  textHex: string,
  isDarkBg: boolean,
  bgHex: string,
  titleSize: number,
  bodySize: number,
  showTopBar: boolean,
  topBarColor: string,
  topBarHeight: number,
  titleColor: string
) {
  const contentItems = slideContent.content || [];
  const slideImages = slideContent.images || [];
  const marginX = style.layout.marginX;
  const contentColor = isDarkBg ? 'FFFFFF' : textHex;
  const actualTopBarHeight = showTopBar ? topBarHeight : 0;

  // 渲染背景
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: bgHex },
  });

  // 渲染顶部装饰条
  if (showTopBar) {
    slide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: topBarHeight,
      fill: { color: topBarColor },
    });
  }

  // 渲染装饰元素
  if (layout.decorations) {
    for (const deco of layout.decorations) {
      slide.addShape('rect', {
        x: deco.rect.x,
        y: deco.rect.y,
        w: deco.rect.w,
        h: deco.rect.h,
        fill: { color: deco.color || primaryHex },
      });
    }
  }

  // 渲染标题
  slide.addText(slideContent.title, {
    x: marginX,
    y: TITLE_HEIGHT - 0.5 + actualTopBarHeight,
    w: SLIDE_WIDTH - marginX * 2,
    h: 0.6,
    fontSize: titleSize - 4,
    fontFace: style.fonts.title,
    color: showTopBar ? 'FFFFFF' : titleColor,
    bold: true,
    align: 'left',
  });

  // 分离文本区域和图片区域
  const textAreas = layout.areas.filter(a => a.type === 'text');
  const imageAreas = layout.areas.filter(a => a.type === 'image');
  const padding = layout.textPadding || 0.15;

  // 计算合适的字号
  const totalContentItems = contentItems.length;
  const textAreaCount = textAreas.length;
  const dynamicBodySize = Math.max(10, Math.min(bodySize, 14 - Math.floor(totalContentItems / (textAreaCount * 3))));

  // 将文本内容分配到各个文本区域
  let itemIndex = 0;
  for (let i = 0; i < textAreas.length && itemIndex < totalContentItems; i++) {
    const area = textAreas[i];
    const areaContent: string[] = [];

    // 计算这个区域应该放多少内容
    const remainingItems = totalContentItems - itemIndex;
    const itemsForThisArea = Math.min(
      Math.ceil(remainingItems / (textAreas.length - i)),
      remainingItems
    );

    for (let j = 0; j < itemsForThisArea && itemIndex < totalContentItems; j++) {
      areaContent.push(contentItems[itemIndex]);
      itemIndex++;
    }

    // 渲染这个区域的内容
    const contentText = areaContent.map(item => `• ${item}`).join('\n');

    slide.addText(contentText, {
      x: area.rect.x + padding,
      y: area.rect.y + padding,
      w: area.rect.w - padding * 2,
      h: area.rect.h - padding * 2,
      fontSize: dynamicBodySize,
      fontFace: style.fonts.body,
      color: contentColor,
      lineSpacing: dynamicBodySize * 1.5,
      bullet: false,
      valign: 'top',
      autoFit: true,
    });
  }

  // 渲染图片到图片区域
  let imagesPlaced = false;
  if (slideImages.length > 0 && imageAreas.length > 0) {
    let imageIndex = 0;
    for (let i = 0; i < imageAreas.length && imageIndex < slideImages.length; i++) {
      const area = imageAreas[i];
      const img = slideImages[imageIndex];

      if (img.base64) {
        try {
          // 按原始比例缩放图片以适应区域
          let finalW = area.rect.w - padding * 2;
          let finalH = area.rect.h - padding * 2;
          let finalX = area.rect.x + padding;
          let finalY = area.rect.y + padding;

          if (img.position.cx > 0 && img.position.cy > 0) {
            const originalAspect = img.position.cx / img.position.cy;
            const areaAspect = finalW / finalH;

            if (originalAspect > areaAspect) {
              // 原图更宽，以宽度为准
              finalH = finalW / originalAspect;
            } else {
              // 原图更高，以高度为准
              finalW = finalH * originalAspect;
            }
            // 居中
            finalX = area.rect.x + padding + (area.rect.w - padding * 2 - finalW) / 2;
            finalY = area.rect.y + padding + (area.rect.h - padding * 2 - finalH) / 2;
          }

          slide.addImage({
            data: img.base64,
            x: finalX,
            y: finalY,
            w: finalW,
            h: finalH,
          });
          imageIndex++;
          imagesPlaced = true;
        } catch (e) {
          console.warn(`[Generate] Failed to add image:`, e);
        }
      }
    }
  }

  return imagesPlaced;
}

/**
 * 渲染图像 - 智能位置计算，避免重叠和覆盖文字
 */
function renderImages(
  slide: PptxGenJS.Slide,
  images: ImageData[],
  style: PPTStyle,
  textBounds?: { y: number; h: number }
) {
  if (!images || images.length === 0) return;

  // 根据图片数量计算布局
  const imageCount = Math.min(images.length, 2); // 最多2张图片
  const layout = calculateImageLayout(imageCount);
  const positions = layout.positions;

  let processedCount = 0;
  for (const img of images) {
    if (processedCount >= 2) break; // 最多处理2张

    // 如果有 base64 数据，添加图像
    if (img.base64) {
      try {
        const pos = positions[processedCount];

        // 计算最终位置和尺寸
        let finalX = pos.x;
        let finalY = pos.y;
        let finalW = pos.w;
        let finalH = pos.h;

        // 如果原图有尺寸信息，按比例缩放但不超过预设尺寸
        if (img.position.cx > 0 && img.position.cy > 0) {
          const originalAspect = img.position.cx / img.position.cy;
          const targetAspect = finalW / finalH;

          if (originalAspect > targetAspect) {
            // 原图更宽，以宽度为准
            finalH = finalW / originalAspect;
          } else {
            // 原图更高，以高度为准
            finalW = finalH * originalAspect;
          }

          // 居中
          finalX = pos.x + (pos.w - finalW) / 2;
          finalY = pos.y + (pos.h - finalH) / 2;
        }

        slide.addImage({
          data: img.base64,
          x: finalX,
          y: finalY,
          w: finalW,
          h: finalH,
        });

        console.log(`[Generate] Added image: ${img.name} at (${finalX.toFixed(2)}, ${finalY.toFixed(2)}) size (${finalW.toFixed(2)}x${finalH.toFixed(2)})`);
        processedCount++;
      } catch (e) {
        console.warn(`[Generate] Failed to add image ${img.name}:`, e);
        addImagePlaceholder(slide, img, style, positions[processedCount]);
        processedCount++;
      }
    } else if (img.placeholder) {
      addImagePlaceholder(slide, img, style, positions[processedCount]);
      processedCount++;
    }
  }
}

/**
 * 在幻灯片底部渲染图片（用于布局模板中）
 */
function renderImagesAtBottom(
  slide: PptxGenJS.Slide,
  images: ImageData[],
  style: PPTStyle
) {
  if (!images || images.length === 0) return;

  const imageCount = Math.min(images.length, 2);
  const MARGIN = 0.3;
  const IMAGE_AREA_HEIGHT = 1.8;

  // 计算图片位置
  const positions: { x: number; y: number; w: number; h: number }[] = [];

  if (imageCount === 1) {
    // 单图居中
    const imgW = 4;
    const imgH = IMAGE_AREA_HEIGHT;
    positions.push({
      x: (SLIDE_WIDTH - imgW) / 2,
      y: SLIDE_HEIGHT - imgH - MARGIN,
      w: imgW,
      h: imgH,
    });
  } else {
    // 双图左右分布
    const imgW = (SLIDE_WIDTH - MARGIN * 3) / 2;
    const imgH = IMAGE_AREA_HEIGHT;
    positions.push({
      x: MARGIN,
      y: SLIDE_HEIGHT - imgH - MARGIN,
      w: imgW,
      h: imgH,
    });
    positions.push({
      x: MARGIN * 2 + imgW,
      y: SLIDE_HEIGHT - imgH - MARGIN,
      w: imgW,
      h: imgH,
    });
  }

  let processedCount = 0;
  for (const img of images) {
    if (processedCount >= 2) break;

    if (img.base64) {
      try {
        const pos = positions[processedCount];

        // 按比例缩放图片
        let finalW = pos.w;
        let finalH = pos.h;
        const finalX = pos.x;
        const finalY = pos.y;

        if (img.position.cx > 0 && img.position.cy > 0) {
          const originalAspect = img.position.cx / img.position.cy;
          if (originalAspect > finalW / finalH) {
            finalH = finalW / originalAspect;
          } else {
            finalW = finalH * originalAspect;
          }
        }

        slide.addImage({
          data: img.base64,
          x: finalX,
          y: finalY,
          w: finalW,
          h: finalH,
        });

        console.log(`[Generate] Image at bottom: ${img.name}`);
        processedCount++;
      } catch (e) {
        console.warn(`[Generate] Failed to add image:`, e);
      }
    }
  }
}

/**
 * 计算图片布局位置 - 智能分配避免重叠，同时返回文本边界
 */
function calculateImageLayout(imageCount: number): ImageLayoutResult {
  const positions: { x: number; y: number; w: number; h: number }[] = [];

  // 内容区域（排除标题）
  const contentX = MARGIN;
  const contentY = TITLE_HEIGHT + MARGIN;
  const contentW = SLIDE_WIDTH - MARGIN * 2;
  const contentH = SLIDE_HEIGHT - TITLE_HEIGHT - MARGIN * 2;

  let textY = contentY;
  let textH = contentH;

  if (imageCount === 0) {
    // 无图片，文本占满内容区域
    return {
      positions: [],
      textBounds: { y: textY, h: textH },
    };
  }

  if (imageCount === 1) {
    // 单张图片：放在底部或右侧，文本区域在上方/左侧
    const imgW = contentW * 0.55;
    const imgH = contentH * 0.5;

    // 图片放在底部居中
    positions.push({
      x: (SLIDE_WIDTH - imgW) / 2,
      y: SLIDE_HEIGHT - imgH - MARGIN,
      w: imgW,
      h: imgH,
    });

    // 文本区域占上方
    textH = contentY - TITLE_HEIGHT - imgH - MARGIN * 2;

    return {
      positions,
      textBounds: { y: textY, h: Math.max(textH, 1.5) },
    };
  }

  if (imageCount >= 2) {
    // 两张图片：左右分布，文本区域在上方
    const imgW = contentW * 0.48;
    const imgH = contentH * 0.55;

    positions.push({
      x: MARGIN,
      y: SLIDE_HEIGHT - imgH - MARGIN,
      w: imgW,
      h: imgH,
    });

    positions.push({
      x: SLIDE_WIDTH - MARGIN - imgW,
      y: SLIDE_HEIGHT - imgH - MARGIN,
      w: imgW,
      h: imgH,
    });

    // 文本区域占上方
    textH = contentY - TITLE_HEIGHT - imgH - MARGIN * 2;

    return {
      positions,
      textBounds: { y: textY, h: Math.max(textH, 1.5) },
    };
  }

  return {
    positions,
    textBounds: { y: textY, h: textH },
  };
}

/**
 * 添加图像占位符（当无法提取图像时）
 */
function addImagePlaceholder(
  slide: PptxGenJS.Slide,
  img: ImageData,
  style: PPTStyle,
  position?: { x: number; y: number; w: number; h: number }
) {
  const x = position?.x ?? 0.5;
  const y = position?.y ?? 1.5;
  const w = position?.w ?? 3;
  const h = position?.h ?? 2;

  // 添加占位符背景
  slide.addShape('rect', {
    x: x,
    y: y,
    w: w,
    h: h,
    fill: { color: 'F0F0F0' },
    line: { color: 'CCCCCC', width: 1 },
  });

  // 添加占位符文字
  slide.addText(img.placeholder || '[图片]', {
    x: x,
    y: y + h / 2 - 0.3,
    w: w,
    h: 0.6,
    fontSize: 12,
    fontFace: style.fonts.body,
    color: '999999',
    align: 'center',
    valign: 'middle',
  });
}
