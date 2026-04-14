import type { ReorganizedContent, SlideContent } from '@/types/ppt';

/**
 * 健壮的 JSON 解析函数
 * 处理 AI 返回的各种格式问题
 */
export function parseJSONSafely(jsonString: string): ReorganizedContent {
  console.log('[JSON Parse] Input length:', jsonString.length);

  // 打印前500字符用于调试
  console.log('[JSON Parse] Preview:', jsonString.substring(0, 500));

  // 方法1：尝试直接解析（清理后的）
  try {
    // 提取 { ... } 部分
    const start = jsonString.indexOf('{');
    const end = jsonString.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      let cleaned = jsonString.substring(start, end + 1);

      // 基础清理
      cleaned = cleaned
        .replace(/,\s*}/g, '}')  // 移除末尾逗号
        .replace(/,\s*]/g, ']')  // 移除数组末尾逗号
        .replace(/[\x00-\x1F\x7F]/g, '')  // 移除控制字符
        .replace(/\s+/g, ' ');  // 压缩空格

      const result = JSON.parse(cleaned);

      if (result.slides && Array.isArray(result.slides) && result.slides.length > 0) {
        console.log('[JSON Parse] Success! Slides:', result.slides.length);
        return validateAndFixSlides(result.slides);
      }
    }
  } catch (e) {
    console.log('[JSON Parse] Direct parse failed:', (e as Error).message);
  }

  // 方法2：使用正则提取每个 slide 对象
  try {
    const cleaned = jsonString
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ');

    // 查找 slides 数组内容
    const slidesMatch = cleaned.match(/"slides"\s*:\s*\[([\s\S]*?)\]\s*$/);
    if (slidesMatch && slidesMatch[1]) {
      const arrayContent = slidesMatch[1];

      // 使用正则匹配每个 slide 对象
      const slideMatches = arrayContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);

      if (slideMatches) {
        console.log('[JSON Parse] Found slides:', slideMatches.length);

        const slides: any[] = [];

        for (const slideStr of slideMatches) {
          try {
            const fixed = slideStr
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']');

            const slide = JSON.parse(fixed);

            if (slide.title || slide.content) {
              // 确保 content 是数组
              if (typeof slide.content === 'string') {
                slide.content = [slide.content];
              }
              if (!Array.isArray(slide.content)) {
                slide.content = [];
              }
              slides.push(slide);
            }
          } catch (e) {
            // 忽略解析失败的单个对象
          }
        }

        if (slides.length > 0) {
          console.log('[JSON Parse] Extracted valid slides:', slides.length);
          return { slides };
        }
      }
    }
  } catch (e) {
    console.log('[JSON Parse] Regex extraction failed:', (e as Error).message);
  }

  // 方法3：最后尝试 - 直接在整个字符串中查找所有 { ... } 对象
  try {
    const cleaned = jsonString
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ');

    const objMatches = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);

    if (objMatches) {
      const slides: any[] = [];

      for (const objStr of objMatches) {
        try {
          const fixed = objStr
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');

          const slide = JSON.parse(fixed);

          if (slide.title || slide.content) {
            if (typeof slide.content === 'string') {
              slide.content = [slide.content];
            }
            if (!Array.isArray(slide.content)) {
              slide.content = [];
            }
            slides.push(slide);
          }
        } catch (e) {
          // 忽略
        }
      }

      if (slides.length > 0) {
        console.log('[JSON Parse] Fallback success:', slides.length);
        return { slides };
      }
    }
  } catch (e) {
    console.log('[JSON Parse] Fallback failed:', (e as Error).message);
  }

  // 返回默认内容
  console.log('[JSON Parse] All methods failed, using default');
  return {
    slides: [{
      title: '内容整理中',
      content: ['请稍候...'],
      layout: 'cover',
      background: 'gradient'
    }]
  };
}

/**
 * 验证并修复 slides 数据
 */
function validateAndFixSlides(slides: any[]): ReorganizedContent {
  const validSlides = slides.map((slide, index) => {
    // 确保有 title
    const title = slide.title || `第 ${index + 1} 页`;

    // 确保 content 是数组
    let content: string[] = [];
    if (Array.isArray(slide.content)) {
      content = slide.content.filter((c: any) => typeof c === 'string');
    } else if (typeof slide.content === 'string') {
      content = [slide.content];
    }

    return {
      title,
      content,
      layout: slide.layout || (index === 0 ? 'cover' : 'content'),
      background: slide.background || 'solid',
      table: slide.table,
      chart: slide.chart,
      listItems: slide.listItems,
      isTransition: slide.isTransition,
      transitionTo: slide.transitionTo,
      notes: slide.notes
    };
  }).filter(slide => slide.content.length > 0 || slide.title);

  if (validSlides.length === 0) {
    return {
      slides: [{
        title: '内容整理中',
        content: ['请稍候...'],
        layout: 'cover',
        background: 'gradient'
      }]
    };
  }

  return { slides: validSlides };
}
