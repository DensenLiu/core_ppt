/**
 * PPT 生成提示词类型定义
 */

export interface PromptConfig {
  /** 提示词名称 */
  name: string;
  /** 提示词描述 */
  description: string;
  /** 系统提示词 */
  systemPrompt: string;
  /** 用户提示词模板 */
  userPromptTemplate: string;
  /** 默认参数 */
  defaultOptions?: PromptOptions;
}

export interface PromptOptions {
  /** 目标页数 */
  targetPageCount: number;
  /** 是否保留原文数据 */
  preserveData: boolean;
  /** 风格类型 */
  styleType: 'business' | 'tech' | 'creative' | 'personal';
  /** 内容充实度要求 */
  minContentLength: number;
  /** 每页要点数量 */
  minPointsPerSlide: number;
}

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'tech' | 'creative' | 'personal';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    title: string;
    body: string;
  };
}

/**
 * 提示词示例
 */
export interface PromptExample {
  /** 输入 */
  input: string;
  /** 期望输出 */
  output: string;
  /** 说明 */
  note?: string;
}
