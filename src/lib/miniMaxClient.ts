import type { ReorganizedContent, SlideContent } from '@/types/ppt';
import { PPT_EXAMPLES, buildUserPrompt, getPromptConfig, type PromptConfig } from '@/prompts';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s';

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MiniMaxRequest {
  model: string;
  messages: MiniMaxMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface MiniMaxResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callMiniMaxAPI(messages: MiniMaxMessage[]): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error('MINIMAX_API_KEY is not configured');
  }

  const endpoint = MINIMAX_MODEL.includes('M2') || MINIMAX_MODEL.includes('M1')
    ? '/text/chatcompletion_v2'
    : '/text/chatcompletion_v2';

  const request: MiniMaxRequest = {
    model: MINIMAX_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 16000,
  };

  console.log('[MiniMax] Calling API:', { endpoint, model: MINIMAX_MODEL, baseUrl: MINIMAX_BASE_URL });

  const response = await fetch(`${MINIMAX_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[MiniMax] API error:', response.status, errorText);
    throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
  }

  const data: MiniMaxResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from MiniMax API');
  }

  const result = data.choices[0].message.content;
  console.log('[MiniMax] Response received, length:', result.length);
  return result;
}

/**
 * 根据用户输入自动选择提示词类型
 */
function selectPromptType(userLogic: string): string {
  const lowerLogic = userLogic.toLowerCase();

  if (lowerLogic.includes('教学') || lowerLogic.includes('培训') || lowerLogic.includes('课程')) {
    return 'education';
  }
  if (lowerLogic.includes('技术') || lowerLogic.includes('架构') || lowerLogic.includes('产品介绍')) {
    return 'tech';
  }
  if (lowerLogic.includes('总') && lowerLogic.includes('分')) {
    return 'structured';
  }
  if (lowerLogic.includes('问题') || lowerLogic.includes('分析') || lowerLogic.includes('风险') || lowerLogic.includes('方案')) {
    return 'problem-analysis';
  }

  return 'business';
}

/**
 * 构建完整的系统提示词（包含示例）
 */
function buildFullSystemPrompt(promptConfig: PromptConfig, hasReferenceStyle: boolean): string {
  let prompt = promptConfig.systemPrompt;

  // 添加示例
  prompt += '\n\n---\n\n## 输出示例\n';
  for (const example of PPT_EXAMPLES) {
    prompt += `\n### 坏的输出（不要这样写）：\n${example.bad}\n\n### 好的输出（必须这样写）：\n${example.good}\n`;
    if (example.note) {
      prompt += `\n**说明**: ${example.note}\n`;
    }
  }

  // 添加格式要求 - 统一使用 • 作为bullet符号
  prompt += `\n\n---\n\n## 输出格式\n\n请直接输出PPT内容，每一页用 "---" 分隔。\n\n---\n# 第1页: 封面标题\n\n**副标题**: 副标题内容\n**汇报人**: XXX | **日期**: 2024年X月\n\n---\n\n# 第2页: 内容页标题\n\n• 要点1：详细描述，至少20字\n• 要点2：详细描述，至少20字\n• 要点3：详细描述，至少20字\n\n---\n\n## 重要提醒\n\n1. 每一页都要有实质内容，不能只有标题\n2. 每个要点至少20字，必须包含具体信息\n3. ${hasReferenceStyle ? '用户提供了参考样式PPT，请保持风格一致' : '使用专业的商务风格'}\n4. 禁止使用模糊表述，必须有具体数据\n5. 禁止内容重复，不同页的要点必须不同\n6. 直接输出内容，不要有任何前缀文字\n\n## 输出开头就是第一页的 \"#\" 标记，不要有任何解释说明`;

  return prompt;
}

/**
 * 构建重组PPT的提示词
 */
function buildReorganizeWithLogicPrompt(
  originalContent: string,
  userLogic: string,
  targetPageCount: number,
  hasReferenceStyle: boolean,
  isRetry: boolean = false
): MiniMaxMessage[] {
  const promptType = selectPromptType(userLogic);
  const promptConfig = getPromptConfig(promptType);
  const contentType = detectContentType(originalContent);
  const formatRules = getFormatRules(contentType);

  console.log("[Prompt] Selected type:", promptType, ", Content type:", contentType, isRetry ? "(RETRY)" : "");

  const systemPrompt = buildFullSystemPrompt(promptConfig, hasReferenceStyle);

  const retryWarning = isRetry ? "\n\n[重要提醒] 这是重试生成，上一次输出格式不规范被拒绝。请务必严格遵守以下格式要求！\n" : "";

  const userPrompt = "## 原始PPT内容\n\n请从以下内容中提取关键信息，按照用户需求重新组织成" + targetPageCount + "页PPT：\n\n" + originalContent + "\n\n---\n## 用户需求\n" + userLogic + "\n\n---\n## 输出格式要求\n\n直接输出markdown格式，每一页用\"---\"分隔：\n- 页面标题用\"# 第X页: 标题\"格式\n- 要点用\"• 要点内容\"格式（圆点符号开头）\n- 每条要点至少20字\n- 禁止加粗、斜体等markdown格式\n- 禁止内容重复\n" + (formatRules ? "\n---\n" + formatRules : "") + "\n" + retryWarning + "\n---\n# 第1页: 封面";

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

/**
 * 通用去重函数：归一化后去除重复内容
 */
function deduplicateContent(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // 归一化：去除多余空白、转变成小写
    const normalized = item.replace(/\s+/g, ' ').trim().toLowerCase();
    // 提取前50字符作为快速比对key
    const key = normalized.substring(0, 50);
    if (seen.has(key)) return false;
    // 检查是否有高度相似的（80%相同）
    for (const existing of seen) {
      if (similarity(key, existing) > 0.8) return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 计算两个字符串的相似度（简单版）
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLen = longer.length;
  return (longerLen - editDistance(longer, shorter)) / longerLen;
}

function editDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * 检测内容类型
 */
function detectContentType(text: string): 'poetry' | 'report' | 'technical' | 'general' {
  const lower = text.toLowerCase();

  // 诗词特征：每行字数相近、有押韵暗示、有词牌名/诗题
  const poetryIndicators = ['词牌', '诗', '词', '韵', '押', '苏轼', '李白', '杜甫', '宋词', '唐诗'];
  const poetryScore = poetryIndicators.filter(k => lower.includes(k)).length;

  // 项目报告特征：进度、风险、里程碑、负责人、Q1/Q2/Q3/Q4
  const reportIndicators = ['进度', '风险', '里程碑', '负责人', 'q1', 'q2', 'q3', 'q4', '项目', '完成率', '指标'];
  const reportScore = reportIndicators.filter(k => lower.includes(k)).length;

  // 技术文档特征：代码、架构、api、模块、函数
  const techIndicators = ['api', '代码', '架构', '模块', '函数', 'interface', 'class', 'http'];
  const techScore = techIndicators.filter(k => lower.includes(k)).length;

  if (poetryScore >= 2) return 'poetry';
  if (reportScore >= 2) return 'report';
  if (techScore >= 2) return 'technical';
  return 'general';
}

/**
 * 根据内容类型返回格式要求
 */
function getFormatRules(contentType: string): string {
  switch (contentType) {
    case 'poetry':
      return "[格式特殊要求-诗词类] (1)诗词原文必须逐句完整呈现，每句一行，绝不能只有要点概括 (2)建议2-3页专门展示原文，便于诵读 (3)封面页只需标题+作者+朝代，不要bullet points (4原文页格式示例：老夫聊发少年狂，左牵黄，右擎苍，锦帽貂裘，千骑卷平冈。";
    case 'report':
      return "[格式特殊要求-项目报告类] 提炼核心要点，突出关键数据和里程碑，结论先行。";
    case 'technical':
      return "[格式特殊要求-技术文档类] 保留技术细节和步骤，模块关系要清晰。";
    default:
      return "[格式通用要求] 每页要点不超过4条，内容精炼，核心信息不可遗漏。";
  }
}

/**
 * 解析 Markdown 格式的 PPT 内容
 */
function parseMarkdownToSlides(markdown: string): ReorganizedContent {
  const slides: SlideContent[] = [];

  const pages = markdown.split(/(?:^|\n)---(?:\n|$)/);

  for (const page of pages) {
    if (!page.trim()) continue;

    const lines = page.trim().split('\n');
    let title = '';
    let layout: 'title' | 'content' | 'two-column' | 'chart' | 'table' | 'list' | 'cover' | 'transition' = 'content';
    let content: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      const titleMatch = trimmed.match(/^#\s*第?\d+[页:]?\s*[:：]?\s*(.+)$/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        continue;
      }

      // 兼容不带#的标题行
      const altTitleMatch = trimmed.match(/^第?\d+[页:]?\s*[:：]?\s*(.+)$/);
      if (altTitleMatch && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
        title = altTitleMatch[1].trim();
        continue;
      }

      const layoutMatch = trimmed.match(/\*\*布局\*\*[:：]\s*(.+)$/);
      if (layoutMatch) {
        const layoutStr = layoutMatch[1].trim().toLowerCase();
        if (layoutStr.includes('封') || layoutStr.includes('cover')) layout = 'cover';
        else if (layoutStr.includes('表格') || layoutStr.includes('table')) layout = 'table';
        else if (layoutStr.includes('图表') || layoutStr.includes('chart')) layout = 'chart';
        else if (layoutStr.includes('过渡') || layoutStr.includes('transition')) layout = 'transition';
        else if (layoutStr.includes('列表') || layoutStr.includes('list')) layout = 'list';
        else if (layoutStr.includes('双栏') || layoutStr.includes('两栏') || layoutStr.includes('two')) layout = 'two-column';
        else layout = 'content';
        continue;
      }

      // 更灵活的bullet匹配
      const bulletMatch = trimmed.match(/^[-*•→◆▸]\s+(.+)$/);
      if (bulletMatch) {
        const point = bulletMatch[1].trim();
        if (point && point.length > 5) {
          content.push(point);
        }
        continue;
      }

      // 兼容编号列表格式
      const numberedMatch = trimmed.match(/^\d+[.、:：]\s*(.+)$/);
      if (numberedMatch) {
        const point = numberedMatch[1].trim();
        if (point && point.length > 5) {
          content.push(point);
        }
        continue;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---')) {
        content.push(trimmed);
      }
    }

    if (title || content.length > 0) {
      slides.push({
        title: title || ("第" + (slides.length + 1) + "页"),
        content: content.length > 0 ? deduplicateContent(content) : ["内容待补充"],
        layout,
        background: layout === "cover" || layout === "transition" ? "gradient" : "solid",
      });
    }
  }

  if (slides.length === 0) {
    const allLines = markdown.split('\n');
    for (const line of allLines) {
      if (line.startsWith('# ')) {
        const title = line.substring(2).trim();
        if (title) {
          slides.push({ title, content: ['内容待整理'], layout: 'content', background: 'solid' });
        }
      }
    }
  }

  if (slides.length === 0) {
    slides.push({ title: '内容整理中', content: ['请稍候...'], layout: 'cover', background: 'gradient' });
  }

  slides.forEach((slide, index) => {
    if (index === 0) {
      slide.layout = 'cover';
      slide.background = 'gradient';
    } else if (index === slides.length - 1) {
      slide.layout = 'cover';
      slide.background = 'gradient';
    } else if (!slide.layout || slide.layout === 'content') {
      slide.layout = 'content';
      slide.background = 'solid';
      if (slide.content.length > 6) {
        slide.layout = 'two-column';
      }
    }
  });

  console.log('[Markdown Parse] Parsed slides:', slides.length);
  return { slides };
}

/**
 * 备用解析函数
 */
function extractFallbackContent(markdown: string, targetPageCount: number): ReorganizedContent {
  const slides: SlideContent[] = [];
  const lines = markdown.split('\n');

  let currentTitle = '';
  let currentContent: string[] = [];
  let currentLayout = 'content';
  let slideCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.match(/^#\s*第\d+页/) || trimmed.startsWith('---')) {
      if (currentTitle || currentContent.length > 0) {
        slideCount++;
        slides.push({
          title: currentTitle || ("第" + slideCount + "页"),
          content: currentContent.length > 0 ? currentContent : ["内容待补充"],
          layout: currentLayout as SlideContent["layout"],
          background: slideCount === 1 || slideCount === targetPageCount ? "gradient" : "solid",
        });
      }
      const titleMatch = trimmed.match(/^#\s*第\d+页\s*[:：]\s*(.+)$/);
      currentTitle = titleMatch ? titleMatch[1].trim() : "";
      currentContent = [];
      currentLayout = "content";
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^[\d]+\.\s+/)) {
      const content = trimmed.replace(/^[-*\d.]+\s+/, "").trim();
      if (content.length > 5) {
        currentContent.push(content);
      }
    }
  }

  if (currentTitle || currentContent.length > 0) {
    slideCount++;
    slides.push({
      title: currentTitle || ("第" + slideCount + "页"),
      content: currentContent.length > 0 ? currentContent : ["内容待补充"],
      layout: currentLayout as SlideContent['layout'],
      background: 'solid',
    });
  }

  if (slides.length === 0) {
    const sections = markdown.split(/^#\s+/m);
    for (let i = 1; i < sections.length && slides.length < targetPageCount; i++) {
      const section = sections[i].trim();
      if (section.length < 5) continue;

      const titleEnd = section.indexOf('\n');
      const title = titleEnd > 0 ? section.substring(0, titleEnd) : ("第" + (slides.length + 1) + "页");
      const body = titleEnd > 0 ? section.substring(titleEnd + 1) : section;

      const points = body.split('\n')
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || l.match(/^\d+\./))
        .map(l => l.replace(/^[-*\d.]+\s+/, '').trim())
        .filter(l => l.length > 5);

      slides.push({
        title: title.substring(0, 50),
        content: points.length > 0 ? points : [body.substring(0, 200)],
        layout: slides.length === 0 ? 'cover' : 'content',
        background: slides.length === 0 ? 'gradient' : 'solid',
      });
    }
  }

  console.log('[Fallback] Extracted slides:', slides.length);
  return { slides };
}

/**
 * 检查内容质量是否合格
 */
function isContentQualityAcceptable(content: ReorganizedContent, targetPageCount: number): { ok: boolean; reason: string } {
  const slides = content.slides;

  // 检查页数
  if (slides.length < targetPageCount * 0.5) {
    return { ok: false, reason: `页数太少: ${slides.length} < ${targetPageCount * 0.5}` };
  }

  // 检查"内容待补充"页数
  const emptyPages = slides.filter(s =>
    s.content.length === 0 ||
    s.content[0]?.includes("内容待补充") ||
    s.content[0]?.includes("请稍候")
  );
  if (emptyPages.length > slides.length * 0.3) {
    return { ok: false, reason: `空白页太多: ${emptyPages.length}/${slides.length}` };
  }

  // 检查内容总长度
  const totalContentLength = slides.reduce((sum, s) =>
    sum + s.content.reduce((csum, c) => csum + c.length, 0), 0
  );
  const avgLengthPerSlide = totalContentLength / slides.length;
  if (avgLengthPerSlide < 50) {
    return { ok: false, reason: `平均内容太短: ${avgLengthPerSlide.toFixed(0)}字符/页` };
  }

  return { ok: true, reason: "ok" };
}

/**
 * 根据用户逻辑直接重组PPT内容（带重试）
 */
export async function reorganizeContentWithLogic(
  originalContent: string,
  userLogic: string,
  targetPageCount: number = 10,
  hasReferenceStyle: boolean = false,
  maxRetries: number = 2
): Promise<ReorganizedContent> {
  let lastError: string = "";
  let lastResponse: string = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(`[Reorganize] Attempt ${attempt + 1}/${maxRetries + 1}`);

    const messages = buildReorganizeWithLogicPrompt(originalContent, userLogic, targetPageCount, hasReferenceStyle, attempt > 0);
    const response = await callMiniMaxAPI(messages);
    lastResponse = response;

    console.log("[Reorganize] AI response length:", response.length);
    console.log("[Reorganize] AI response preview:", response.substring(0, 2000));

    try {
      let content = parseMarkdownToSlides(response);
      console.log("[Reorganize] Parsed slides count:", content.slides.length);

      // 检查页数是否足够
      if (content.slides.length < targetPageCount * 0.5) {
        console.log(`[Reorganize] Page count too low: ${content.slides.length}, retrying...`);
        lastError = `页数不足: ${content.slides.length} < ${targetPageCount * 0.5}`;
        continue;
      }

      // 尝试备用解析
      if (content.slides.length === 0 ||
          (content.slides.length === 1 && content.slides[0].title === "内容整理中") ||
          content.slides.every(s => s.content.length === 0 || s.content[0]?.includes("待补充"))) {
        console.log("[Reorganize] Primary parsing failed, trying fallback...");
        const fallbackSlides = extractFallbackContent(response, targetPageCount);
        if (fallbackSlides.slides.length > 0) {
          content = fallbackSlides;
        } else {
          lastError = "AI 返回内容解析失败";
          continue;
        }
      }

      // 去重和清理
      content.slides = content.slides.map((slide, index) => {
        const finalContent = deduplicateContent(slide.content);

        // 封面页：如果标题存在但内容为空，使用标题作为副标题
        if (index === 0 && finalContent.length === 0 && slide.title) {
          return {
            ...slide,
            content: [slide.title],
            layout: "cover",
            background: "gradient",
          };
        }

        return {
          ...slide,
          content: finalContent.length > 0 ? finalContent : ["内容待补充"],
          layout: slide.layout || "content",
          background: slide.background || (index === 0 || index === content.slides.length - 1 ? "gradient" : "solid"),
        };
      });

      // 质量检查
      const qualityCheck = isContentQualityAcceptable(content, targetPageCount);
      if (!qualityCheck.ok) {
        console.log(`[Reorganize] Quality check failed: ${qualityCheck.reason}, retrying...`);
        lastError = qualityCheck.reason;
        continue;
      }

      console.log("[Reorganize] Quality check passed");
      return content;

    } catch (error) {
      console.error("[Reorganize] Parse error:", error);
      lastError = error instanceof Error ? error.message : "Unknown error";
      continue;
    }
  }

  // 所有重试都失败了，返回最后结果或抛出异常
  console.error("[Reorganize] All retries failed, last error:", lastError);
  throw new Error("AI 内容生成失败，请重试。错误: " + lastError);
}
