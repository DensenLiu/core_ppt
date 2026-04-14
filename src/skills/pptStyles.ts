// PPT 样式 Skill 定义
// 这个文件定义了各种精美的PPT样式模板

export interface PPTStyle {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'personal' | 'tech' | 'creative';

  // 颜色配置
  colors: {
    primary: string;      // 主色（标题栏、强调）
    secondary: string;    // 辅色
    accent: string;       // 点缀色
    background: string;   // 背景色
    text: string;         // 文字色
    textLight: string;    // 浅色文字（彩色背景上）
  };

  // 字体配置
  fonts: {
    title: string;
    body: string;
  };

  // 字号配置
  sizes: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
  };

  // 布局配置
  layout: {
    titleY: number;
    contentY: number;
    marginX: number;
    marginY: number;
  };

  // 装饰元素
  decorations?: {
    showTopBar: boolean;
    showBottomBar: boolean;
    showPageNumber: boolean;
    dividerStyle: 'line' | 'gradient' | 'none';
  };
}

// 预定义样式库
export const STYLE_TEMPLATES: PPTStyle[] = [
  // === 商务风格 ===
  {
    id: 'business-blue',
    name: '商务蓝',
    description: '专业稳重的深蓝色商务风格',
    category: 'business',
    colors: {
      primary: '1F4E78',
      secondary: '2E75B6',
      accent: '4472C4',
      background: 'FFFFFF',
      text: '2D3748',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 36,
      subtitle: 24,
      body: 16,
      small: 12,
    },
    layout: {
      titleY: 0.5,
      contentY: 1.6,
      marginX: 0.6,
      marginY: 0.5,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: false,
      showPageNumber: true,
      dividerStyle: 'line',
    },
  },

  {
    id: 'business-gold',
    name: '尊享金',
    description: '高端大气的金色商务风格',
    category: 'business',
    colors: {
      primary: 'B8860B',
      secondary: 'DAA520',
      accent: 'FFD700',
      background: 'FFFCF5',
      text: '3D3D3D',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 38,
      subtitle: 24,
      body: 17,
      small: 11,
    },
    layout: {
      titleY: 0.6,
      contentY: 1.7,
      marginX: 0.7,
      marginY: 0.6,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: true,
      showPageNumber: true,
      dividerStyle: 'gradient',
    },
  },

  // === 科技风格 ===
  {
    id: 'tech-green',
    name: '科技绿',
    description: '现代科技的绿色极简风格',
    category: 'tech',
    colors: {
      primary: '00A86B',
      secondary: '00C853',
      accent: '69F0AE',
      background: 'F8FAF9',
      text: '263238',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 34,
      subtitle: 22,
      body: 15,
      small: 11,
    },
    layout: {
      titleY: 0.4,
      contentY: 1.5,
      marginX: 0.5,
      marginY: 0.4,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: false,
      showPageNumber: true,
      dividerStyle: 'none',
    },
  },

  {
    id: 'tech-dark',
    name: '暗夜科技',
    description: '深色背景的科技感风格',
    category: 'tech',
    colors: {
      primary: '00BCD4',
      secondary: '26C6DA',
      accent: '4DD0E1',
      background: '1A1A2E',
      text: 'E8E8E8',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 36,
      subtitle: 24,
      body: 16,
      small: 12,
    },
    layout: {
      titleY: 0.5,
      contentY: 1.6,
      marginX: 0.6,
      marginY: 0.5,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: false,
      showPageNumber: true,
      dividerStyle: 'line',
    },
  },

  // === 个人汇报风格 ===
  {
    id: 'personal-warm',
    name: '温暖个人',
    description: '温馨友好的个人汇报风格',
    category: 'personal',
    colors: {
      primary: 'FF7043',
      secondary: 'FF8A65',
      accent: 'FFAB91',
      background: 'FFFAF6',
      text: '4A4A4A',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 38,
      subtitle: 26,
      body: 18,
      small: 12,
    },
    layout: {
      titleY: 0.6,
      contentY: 1.8,
      marginX: 0.7,
      marginY: 0.6,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: false,
      showPageNumber: false,
      dividerStyle: 'none',
    },
  },

  {
    id: 'personal-minimal',
    name: '简约个人',
    description: '干净简洁的个人风格',
    category: 'personal',
    colors: {
      primary: '5C6BC0',
      secondary: '7986CB',
      accent: '9FA8DA',
      background: 'FAFBFC',
      text: '37474F',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 40,
      subtitle: 26,
      body: 18,
      small: 12,
    },
    layout: {
      titleY: 0.5,
      contentY: 1.7,
      marginX: 0.8,
      marginY: 0.5,
    },
    decorations: {
      showTopBar: false,
      showBottomBar: false,
      showPageNumber: true,
      dividerStyle: 'line',
    },
  },

  // === 创意风格 ===
  {
    id: 'creative-purple',
    name: '梦幻紫',
    description: '富有创意的紫色渐变风格',
    category: 'creative',
    colors: {
      primary: '7C4DFF',
      secondary: 'B388FF',
      accent: 'EA80FC',
      background: 'F5F3FF',
      text: '311B92',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 36,
      subtitle: 24,
      body: 16,
      small: 12,
    },
    layout: {
      titleY: 0.5,
      contentY: 1.6,
      marginX: 0.6,
      marginY: 0.5,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: false,
      showPageNumber: true,
      dividerStyle: 'gradient',
    },
  },

  {
    id: 'creative-orange',
    name: '活力橙',
    description: '充满活力的橙色创意风格',
    category: 'creative',
    colors: {
      primary: 'FF5722',
      secondary: 'FF7043',
      accent: 'FF8A65',
      background: 'FFF8F0',
      text: '3E2723',
      textLight: 'FFFFFF',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    sizes: {
      title: 38,
      subtitle: 26,
      body: 17,
      small: 12,
    },
    layout: {
      titleY: 0.6,
      contentY: 1.7,
      marginX: 0.7,
      marginY: 0.6,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: true,
      showPageNumber: true,
      dividerStyle: 'line',
    },
  },
];

// 根据ID获取样式
export function getStyleById(id: string): PPTStyle | undefined {
  return STYLE_TEMPLATES.find(style => style.id === id);
}

// 根据分类获取样式
export function getStylesByCategory(category: PPTStyle['category']): PPTStyle[] {
  return STYLE_TEMPLATES.filter(style => style.category === category);
}

// 获取所有可用样式
export function getAllStyles(): PPTStyle[] {
  return STYLE_TEMPLATES;
}
