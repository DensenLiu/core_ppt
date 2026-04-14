// PPT Content Types

// 表格数据
export interface TableData {
  headers: string[];
  rows: string[][];
  title?: string;
}

// 图表数据
export interface ChartData {
  type: 'bar' | 'column' | 'pie' | 'line';
  title: string;
  categories: string[];
  series: { name: string; values: number[] }[];
}

// 列表项（可用于对比、步骤等）
export interface ListItem {
  title: string;
  content: string;
  highlight?: boolean; // 是否高亮显示
}

// 图片数据
export interface ImageData {
  id: string;
  name: string;
  originalPath: string;  // PPTX 内部路径
  position: { x: number; y: number; cx: number; cy: number }; // 位置和尺寸
  placeholder?: string;  // 如果图片无法提取，用占位符描述
  base64?: string;       // 图片的 base64 编码数据
}

// 幻灯片内容
export interface SlideContent {
  title: string;
  content: string[];

  // 视觉元素
  layout?: 'title' | 'content' | 'two-column' | 'chart' | 'table' | 'list' | 'cover' | 'transition';
  background?: 'solid' | 'gradient' | 'image' | 'none';

  // 表格
  table?: TableData;

  // 图表
  chart?: ChartData;

  // 列表/对比
  listItems?: ListItem[];

  // 图像
  images?: ImageData[];

  // 过渡页
  isTransition?: boolean;
  transitionTo?: string; // 过渡到哪个章节

  // 备注
  notes?: string;
  source?: string; // 该页内容对应的原文位置
}

// 通用PPT分析格式
export interface PPTAnalysis {
  // 识别PPT类型
  originalType: string;
  // 原文结构
  originalStructure: string[];
  // 关键要点
  keyPoints: {
    section: string;
    summary: string;
    originalContent: string[];
  }[];
  // 数据和结论
  data: {
    metrics: string[];
    conclusions: string[];
  };
  // 风格
  style: {
    tone: string;
    format: string;
  };
  // 兼容旧格式（网络评估）
  evaluationDimensions?: EvaluationDimension[];
  networkInfo?: NetworkInfo;
  assessmentResults?: AssessmentResult[];
}

export interface EvaluationDimension {
  name: string;
  description: string;
  items: EvaluationItem[];
}

export interface EvaluationItem {
  name: string;
  status: 'pass' | 'warning' | 'fail' | 'unknown';
  description: string;
  evidence?: string;
  suggestions?: string[];
}

export interface NetworkInfo {
  networkElements: string[];
  deploymentLocations: string[];
  disasterRecovery: string[];
}

export interface AssessmentResult {
  dimension: string;
  riskLevel: 'high' | 'medium' | 'low';
  risks: string[];
  evidence: string;
  suggestions: string[];
}

export interface ReorganizedContent {
  slides: SlideContent[];
}

export interface StyleConfig {
  themeColor: string;
  fontFamily: string;
  backgroundColor?: string;
  titleFontSize: number;
  bodyFontSize: number;
  textColor?: string;
  // 扩展颜色
  secondaryColor?: string;
  accentColor?: string;
  titleColor?: string;
  // 装饰
  hasTopBar?: boolean;
  topBarColor?: string;
  topBarHeight?: number;
  // 内容样式
  bulletStyle?: 'dot' | 'dash' | 'number' | 'none';
}

// PPTStyle 完整类型（用于生成PPT）
export interface PPTStyle {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'personal' | 'tech' | 'creative' | 'reference';

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textLight: string;
    // 扩展颜色
    titleColor?: string;
    subtitleColor?: string;
  };

  fonts: {
    title: string;
    body: string;
  };

  sizes: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
  };

  layout: {
    titleY: number;
    contentY: number;
    marginX: number;
    marginY: number;
  };

  decorations?: {
    showTopBar: boolean;
    showBottomBar: boolean;
    showPageNumber: boolean;
    dividerStyle: 'line' | 'gradient' | 'none';
    // 扩展装饰
    topBarColor?: string;
    topBarHeight?: number;
    titleUnderline?: boolean;
  };

  content?: {
    bulletStyle?: 'dot' | 'dash' | 'number' | 'none';
    lineSpacing?: number;
  };
}

export interface GenerationRequest {
  originalFileId: string;
  referenceFileId?: string;
  userLogic: string;
  targetPageCount: number;
  stylePreference?: 'reference' | 'builtin';
  builtinStyle?: 'business' | 'tech' | 'simple';
}

export interface GenerationResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  pageCount?: number;
  message?: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  uploadedAt: Date;
  type: 'original' | 'reference';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
