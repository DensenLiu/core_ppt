/**
 * PPT 内置布局模板
 * 定义常用的布局样式，用于生成 PPT 时的参考
 */

// 布局区域定义
export interface LayoutRect {
  x: number;      // 起始 X 坐标（英寸）
  y: number;      // 起始 Y 坐标（英寸）
  w: number;       // 宽度（英寸）
  h: number;       // 高度（英寸）
}

// 内容区域
export interface ContentArea {
  rect: LayoutRect;
  type: 'text' | 'image' | 'table' | 'chart';
}

// 装饰元素
export interface DecorationElement {
  rect: LayoutRect;
  type: 'line' | 'bar' | 'dot';
  color?: string;
}

// 单个布局模板
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  // 内容区域
  areas: ContentArea[];
  // 装饰元素
  decorations?: DecorationElement[];
  // 文本区域的默认边距
  textPadding?: number;
  // 布局提示
  hint?: string;
}

// 幻灯片尺寸 (16:9)
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.5;
const TITLE_H = 0.63;
const TITLE_Y = 0.23;
const CONTENT_Y = TITLE_H + TITLE_Y + 0.2; // ~1.06

/**
 * 内置布局模板
 */
export const BUILTIN_LAYOUTS: LayoutTemplate[] = [
  // ========== 1. 左右双栏布局 ==========
  {
    id: 'two-column',
    name: '左右双栏',
    description: '标题在顶部，下方左右两个等宽内容区域',
    hint: '适用于对比、分类等场景',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 3) / 2, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 2 + (SLIDE_W - MARGIN * 3) / 2, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 3) / 2, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
    ],
    decorations: [
      // 标题下划线装饰
      { rect: { x: MARGIN, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W - MARGIN - 0.87, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
    ],
    textPadding: 0.15,
  },

  // ========== 2. 上下双栏布局 ==========
  {
    id: 'top-bottom',
    name: '上下双栏',
    description: '标题在顶部，下方两个内容区域上下排列',
    hint: '适用于总-分结构的场景',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: SLIDE_W - MARGIN * 2, h: 1.8 },
        type: 'text',
      },
      {
        rect: { x: MARGIN, y: CONTENT_Y + 2.0, w: SLIDE_W - MARGIN * 2, h: SLIDE_H - CONTENT_Y - 2.0 - MARGIN },
        type: 'text',
      },
    ],
    decorations: [
      { rect: { x: MARGIN, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W - MARGIN - 0.87, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
    ],
    textPadding: 0.15,
  },

  // ========== 3. 三栏布局 ==========
  {
    id: 'three-column',
    name: '三栏布局',
    description: '标题在顶部，下方三个等宽内容区域并列',
    hint: '适用于三点并列、对比分析等场景',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 2 + (SLIDE_W - MARGIN * 4) / 3, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 3 + (SLIDE_W - MARGIN * 4) / 3 * 2, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
    ],
    decorations: [
      { rect: { x: MARGIN, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W / 2 - 0.44, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W - MARGIN - 0.87, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
    ],
    textPadding: 0.12,
  },

  // ========== 4. 单栏布局（全文） ==========
  {
    id: 'single-column',
    name: '单栏布局',
    description: '标题在顶部，下方一个大面积内容区域',
    hint: '适用于内容较多、需要详细说明的场景',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: SLIDE_W - MARGIN * 2, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
    ],
    decorations: [
      { rect: { x: MARGIN, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W - MARGIN - 0.87, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
    ],
    textPadding: 0.2,
  },

  // ========== 5. 左侧栏+右侧大图布局 ==========
  {
    id: 'left-sidebar',
    name: '左侧栏',
    description: '左侧一个小区域（标题/导航），右侧大面积内容',
    hint: '适用于目录页、章节导航等场景',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: 2.5, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 2 + 2.5, y: CONTENT_Y, w: SLIDE_W - MARGIN * 3 - 2.5, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
    ],
    textPadding: 0.15,
  },

  // ========== 6. 上标题+下三栏 ==========
  {
    id: 'title-top-three-bottom',
    name: '上标题下三栏',
    description: '顶部标题区，下方三个内容栏',
    hint: '适用于多要点总结、对比分析',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 2 + (SLIDE_W - MARGIN * 4) / 3, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 3 + (SLIDE_W - MARGIN * 4) / 3 * 2, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - MARGIN },
        type: 'text',
      },
    ],
    decorations: [
      { rect: { x: MARGIN, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W / 2 - 0.44, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W - MARGIN - 0.87, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
    ],
    textPadding: 0.12,
  },

  // ========== 7. 左右双栏+底部总结条 ==========
  {
    id: 'two-column-bottom-bar',
    name: '双栏+底部总结',
    description: '左右双栏内容，底部横条用于总结',
    hint: '适用于有总结要点的章节结尾',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 3) / 2, h: SLIDE_H - CONTENT_Y - 1.2 },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 2 + (SLIDE_W - MARGIN * 3) / 2, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 3) / 2, h: SLIDE_H - CONTENT_Y - 1.2 },
        type: 'text',
      },
      // 底部总结横条
      {
        rect: { x: MARGIN, y: SLIDE_H - MARGIN - 0.42, w: SLIDE_W - MARGIN * 2, h: 0.42 },
        type: 'text',
      },
    ],
    decorations: [
      { rect: { x: MARGIN, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W - MARGIN - 0.87, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
    ],
    textPadding: 0.15,
  },

  // ========== 8. 三栏+底部总结条 ==========
  {
    id: 'three-column-bottom-bar',
    name: '三栏+底部总结',
    description: '三栏内容，底部横条用于总结',
    hint: '适用于章节结尾需要总结的场景',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - 1.2 },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 2 + (SLIDE_W - MARGIN * 4) / 3, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - 1.2 },
        type: 'text',
      },
      {
        rect: { x: MARGIN * 3 + (SLIDE_W - MARGIN * 4) / 3 * 2, y: CONTENT_Y, w: (SLIDE_W - MARGIN * 4) / 3, h: SLIDE_H - CONTENT_Y - 1.2 },
        type: 'text',
      },
      // 底部总结横条
      {
        rect: { x: MARGIN, y: SLIDE_H - MARGIN - 0.42, w: SLIDE_W - MARGIN * 2, h: 0.42 },
        type: 'text',
      },
    ],
    decorations: [
      { rect: { x: MARGIN, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W / 2 - 0.44, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
      { rect: { x: SLIDE_W - MARGIN - 0.87, y: TITLE_Y + TITLE_H + 0.05, w: 0.87, h: 0.05 }, type: 'bar' },
    ],
    textPadding: 0.12,
  },

  // ========== 9. 封面布局 ==========
  {
    id: 'cover',
    name: '封面',
    description: '大标题居中，副标题在下方',
    hint: '用于章节封面、标题页',
    areas: [
      {
        rect: { x: MARGIN, y: SLIDE_H * 0.35, w: SLIDE_W - MARGIN * 2, h: 1.2 },
        type: 'text',
      },
      {
        rect: { x: MARGIN, y: SLIDE_H * 0.35 + 1.5, w: SLIDE_W - MARGIN * 2, h: 0.8 },
        type: 'text',
      },
    ],
    textPadding: 0.2,
  },

  // ========== 10. 过渡页布局 ==========
  {
    id: 'transition',
    name: '过渡页',
    description: '大标题居中，用于章节过渡',
    hint: '用于章节分隔页',
    areas: [
      {
        rect: { x: MARGIN, y: SLIDE_H * 0.4, w: SLIDE_W - MARGIN * 2, h: 1.0 },
        type: 'text',
      },
    ],
    textPadding: 0.15,
  },

  // ========== 11. 左上文右下图 ==========
  {
    id: 'left-top-right-bottom',
    name: '左上文右下',
    description: '左上小区域文本，右下大面积图片',
    hint: '适用于有图片的内容页，图片占右下独立区域',
    areas: [
      {
        rect: { x: MARGIN, y: CONTENT_Y, w: SLIDE_W * 0.4, h: 1.6 },
        type: 'text',
      },
      {
        rect: { x: MARGIN, y: CONTENT_Y + 1.8, w: SLIDE_W - MARGIN * 2, h: SLIDE_H - CONTENT_Y - 1.8 - MARGIN },
        type: 'image',
      },
    ],
    textPadding: 0.15,
  },
];

/**
 * 根据 ID 获取布局模板
 */
export function getLayoutById(id: string): LayoutTemplate | undefined {
  return BUILTIN_LAYOUTS.find(layout => layout.id === id);
}

/**
 * 获取所有布局模板
 */
export function getAllLayouts(): LayoutTemplate[] {
  return BUILTIN_LAYOUTS;
}

/**
 * 根据内容类型推荐布局
 */
export function recommendLayouts(contentType: 'list' | 'comparison' | 'narrative' | 'summary'): LayoutTemplate[] {
  switch (contentType) {
    case 'list':
      // 列表类型推荐单栏或双栏
      return BUILTIN_LAYOUTS.filter(l => ['single-column', 'two-column', 'left-sidebar'].includes(l.id));
    case 'comparison':
      // 对比类型推荐双栏或三栏
      return BUILTIN_LAYOUTS.filter(l => ['two-column', 'three-column', 'two-column-bottom-bar'].includes(l.id));
    case 'narrative':
      // 叙述类型推荐单栏或上下
      return BUILTIN_LAYOUTS.filter(l => ['single-column', 'top-bottom', 'left-sidebar'].includes(l.id));
    case 'summary':
      // 总结类型推荐带底部横条的
      return BUILTIN_LAYOUTS.filter(l => ['two-column-bottom-bar', 'three-column-bottom-bar', 'single-column'].includes(l.id));
    default:
      return BUILTIN_LAYOUTS;
  }
}
