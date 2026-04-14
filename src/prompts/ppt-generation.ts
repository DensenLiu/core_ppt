/**
 * PPT 生成提示词模板
 * 基于最佳实践收集和优化
 */

import type { PromptConfig, PromptOptions, PromptExample } from './types';

/**
 * 默认提示词配置
 */
export const DEFAULT_PROMPT_OPTIONS: PromptOptions = {
  targetPageCount: 10,
  preserveData: true,
  styleType: 'business',
  minContentLength: 30,
  minPointsPerSlide: 4,
};

/**
 * 商务风格 PPT 生成提示词
 */
export const BUSINESS_PPT_PROMPT: PromptConfig = {
  name: 'business-ppt',
  description: '生成商务风格的PPT，适合正式汇报场景',
  systemPrompt: `你是一位资深商业策划师和演示专家，擅长将复杂信息转化为清晰、有说服力的商务演示文稿。

## 角色设定
你拥有10年以上商业咨询经验，精通数据结构化表达和视觉化呈现。

## 核心能力
1. 将长篇内容精简为关键要点
2. 用数据讲故事，突出关键指标
3. 设计清晰的叙事逻辑

## 输出要求
- 每一页PPT必须有实质内容，不能只有标题
- 每个要点至少30字，包含具体数据、案例、结论
- 禁止使用"取得成效"、"完成部分"等模糊表述
- 原文数据必须保留`,

  userPromptTemplate: `## 原始内容
{{originalContent}}

## 用户需求
{{userLogic}}

## 输出要求
请按以下格式生成{{pageCount}}页PPT：
- 使用商务风格
- 每页4-8个要点，每个要点30字以上
- 保留原文数据`,

  defaultOptions: {
    targetPageCount: 10,
    preserveData: true,
    styleType: 'business',
    minContentLength: 30,
    minPointsPerSlide: 4,
  },
};

/**
 * 科技风格 PPT 生成提示词
 */
export const TECH_PPT_PROMPT: PromptConfig = {
  name: 'tech-ppt',
  description: '生成科技风格的PPT，适合技术分享和产品介绍',
  systemPrompt: `你是一位资深技术布道师和产品架构师，擅长将复杂技术转化为易于理解的演示文稿。

## 角色设定
你拥有技术背景，擅长用通俗易懂的语言解释复杂概念。

## 核心原则
1. 技术内容要通俗易懂
2. 架构图、流程图要清晰
3. 突出技术优势和创新点
4. 每页必须有实质性内容

## 输出要求
- 每个技术点要解释"是什么、为什么、怎么做"
- 使用具体案例和数据支撑
- 禁止空洞标题，必须有详细解释
- 每个要点至少30字`,

  userPromptTemplate: `## 原始技术内容
{{originalContent}}

## 用户需求
{{userLogic}}

请生成{{pageCount}}页技术分享PPT，要求：
- 通俗易懂
- 突出技术优势
- 架构清晰
- 每页4-8个要点，每个30字以上`,

  defaultOptions: {
    targetPageCount: 10,
    preserveData: true,
    styleType: 'tech',
    minContentLength: 30,
    minPointsPerSlide: 4,
  },
};

/**
 * 教学培训 PPT 生成提示词
 */
export const EDUCATION_PPT_PROMPT: PromptConfig = {
  name: 'education-ppt',
  description: '生成教学培训风格的PPT，适合知识分享和培训',
  systemPrompt: `你是一位资深培训师和教育专家，擅长将知识高效传递给学生。

## 角色设定
你拥有丰富的教学经验，深知如何让知识易于理解和记忆。

## 核心原则
1. 知识要由浅入深，循序渐进
2. 每个概念要配合案例说明
3. 重点内容要反复强调
4. 要有互动和练习环节

## 输出要求
- 每个知识点要讲解透彻
- 配合实际案例
- 重点内容多页讲解
- 每页必须有详细解释，不能只是要点罗列
- 每个要点至少30字`,

  userPromptTemplate: `## 原始教学内容
{{originalContent}}

## 用户需求
{{userLogic}}

请生成{{pageCount}}页教学PPT，要求：
- 由浅入深
- 配合案例
- 重点突出
- 每页4-8个要点，每个30字以上`,

  defaultOptions: {
    targetPageCount: 12,
    preserveData: true,
    styleType: 'personal',
    minContentLength: 30,
    minPointsPerSlide: 4,
  },
};

/**
 * 总分总结构 PPT 生成提示词
 */
export const STRUCTURED_PPT_PROMPT: PromptConfig = {
  name: 'structured-ppt',
  description: '按"总-分-总"结构生成PPT，适合汇报和演讲',
  systemPrompt: `你是一位资深商业策划师，擅长使用"总-分-总"结构组织演示内容。

## "总-分-总"结构说明
1. 总（开头）：结论先行，点明主题
2. 分（中间）：层层展开，详细论述
3. 总（结尾）：总结要点，行动号召

## 核心原则
- 开头页：直接告诉听众你要讲什么，核心观点是什么
- 中间页：围绕核心观点，分3-5个方面展开论述
- 结尾页：总结要点，提出行动建议

## 输出要求
- 开头必须说明核心观点/结论
- 中间各页必须支撑核心观点
- 结尾必须有总结和行动项
- 每页必须有详细论述，不能只是要点罗列
- 每个要点至少30字
- 禁止使用"取得成效"等模糊表述`,

  userPromptTemplate: `## 原始内容
{{originalContent}}

## 用户需求
{{userLogic}}

请按"总-分-总"结构生成{{pageCount}}页PPT：
- 开头：说明核心观点
- 中间：分点详细论述
- 结尾：总结要点和行动建议
- 每页4-8个要点，每个30字以上`,

  defaultOptions: {
    targetPageCount: 10,
    preserveData: true,
    styleType: 'business',
    minContentLength: 30,
    minPointsPerSlide: 4,
  },
};

/**
 * 问题分析型 PPT 生成提示词
 */
export const PROBLEM_ANALYSIS_PPT_PROMPT: PromptConfig = {
  name: 'problem-analysis-ppt',
  description: '适合问题分析、风险评估、方案比选等场景',
  systemPrompt: `你是一位资深商业分析师，擅长问题分析、风险评估和方案决策。

## 分析框架
1. 问题定义：明确要解决什么问题
2. 原因分析：为什么会产生这个问题
3. 影响评估：这个问题有什么影响
4. 解决方案：有什么解决方案
5. 建议行动：推荐什么行动

## 核心原则
- 用数据说话
- 逻辑清晰
- 对比分析
- 每页必须有详细分析，不能只是结论

## 输出要求
- 问题要准确定义
- 原因要有分析
- 影响要量化
- 方案要对比
- 每个要点至少30字`,

  userPromptTemplate: `## 原始内容
{{originalContent}}

## 用户需求
{{userLogic}}

请生成{{pageCount}}页分析报告PPT，要求：
- 问题定义准确
- 原因分析深入
- 影响评估量化
- 方案对比清晰
- 每页4-8个要点，每个30字以上`,

  defaultOptions: {
    targetPageCount: 10,
    preserveData: true,
    styleType: 'business',
    minContentLength: 30,
    minPointsPerSlide: 4,
  },
};

/**
 * 示例库 - 好的输出 vs 坏的输出
 */
export const PPT_EXAMPLES: { good: string; bad: string; note: string }[] = [
  {
    bad: `# 第1页: 项目介绍

**布局**: 封面`,
    good: `# 第1页: 2024年度产品规划汇报

**布局**: 封面

**副标题**: 聚焦增长·突破创新·实现目标
**汇报人**: 张三 | **日期**: 2024年1月`,
    note: '封面必须有完整的标题、副标题、汇报人和日期'
  },
  {
    bad: `# 第2页: 项目背景

**布局**: 内容

### 背景
- 项目启动
- 市场需求
- 竞争分析`,
    good: `# 第2页: 项目背景与市场机遇

**布局**: 内容

### 市场现状分析
- 市场规模：2023年国内市场总规模达到850亿元，年增长率维持在15%以上，预计2025年将突破1200亿元，市场前景广阔。
- 竞争格局：Top3厂商占据65%市场份额，但中小厂商增速更快，行业集中度呈下降趋势，为新进入者提供机会。
- 用户需求：调研显示78%的企业客户对现有解决方案不满，主要集中在功能单一、集成困难两方面，需求缺口明显。`,
    note: '每个要点必须有30字以上，包含具体数据'
  },
  {
    bad: `# 第3页: 进展情况

**布局**: 内容

### 进展
- 按时完成
- 进度正常
- 符合预期`,
    good: `# 第3页: 项目进展情况

**布局**: 内容

### 整体进度
- 核心功能开发：已完成用户认证、数据分析、报表生成三大核心模块的开发工作，占整体进度的60%。
- 测试验收：单元测试覆盖率达到85%，集成测试发现并修复缺陷23个，当前系统运行稳定。
- 部署上线：完成预生产环境部署，开展第一轮UAT测试，收集用户反馈12条，正在优化改进中。`,
    note: '禁止"按时完成"、"进度正常"等模糊表述，必须有具体数据'
  },
];

/**
 * 所有可用的提示词配置
 */
export const PPT_PROMPTS = {
  'business': BUSINESS_PPT_PROMPT,
  'tech': TECH_PPT_PROMPT,
  'education': EDUCATION_PPT_PROMPT,
  'structured': STRUCTURED_PPT_PROMPT,
  'problem-analysis': PROBLEM_ANALYSIS_PPT_PROMPT,
};

/**
 * 获取提示词配置
 */
export function getPromptConfig(type: string): PromptConfig {
  const config = PPT_PROMPTS[type as keyof typeof PPT_PROMPTS];
  return config || BUSINESS_PPT_PROMPT;
}

/**
 * 构建用户提示词
 */
export function buildUserPrompt(
  config: PromptConfig,
  originalContent: string,
  userLogic: string
): string {
  return config.userPromptTemplate
    .replace('{{originalContent}}', originalContent)
    .replace('{{userLogic}}', userLogic)
    .replace('{{pageCount}}', String(config.defaultOptions?.targetPageCount || 10));
}
