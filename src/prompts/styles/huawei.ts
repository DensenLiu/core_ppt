/**
 * 华为风格 PPT 模板
 * 特点：简洁、专业、商务、注重细节
 */

import type { PPTStyle } from '@/types/ppt';

export const HUAWEI_STYLE: PPTStyle = {
  id: 'huawei',
  name: '华为风格',
  description: '简洁专业、商务大气，注重细节和品质感',
  category: 'business',

  // 华为品牌色 - 经典华为蓝
  colors: {
    primary: '0071BC',      // 华为蓝主色
    secondary: '003366',    // 深蓝辅助
    accent: 'FF6600',       // 橙色点缀（华为logo配色）
    background: 'FFFFFF',   // 白色背景
    text: '333333',         // 深灰文字
    textLight: 'FFFFFF',    // 浅色文字
  },

  // 字体配置 - 简洁有力
  fonts: {
    title: 'Microsoft YaHei',
    body: 'Microsoft YaHei',
  },

  // 字号配置 - 清晰大气
  sizes: {
    title: 36,
    subtitle: 22,
    body: 14,
    small: 10,
  },

  // 布局配置
  layout: {
    titleY: 0.4,
    contentY: 1.3,
    marginX: 0.6,
    marginY: 0.5,
  },

  // 装饰元素 - 简洁为主
  decorations: {
    showTopBar: true,
    showBottomBar: false,
    showPageNumber: true,
    dividerStyle: 'line',
  },
};

/**
 * 华为风格的特点说明
 */
export const HUAWEI_STYLE_GUIDE = `
华为风格特点：
1. 配色：主色调为华为蓝(0071BC)，搭配深蓝和橙色点缀
2. 布局：简洁大气，注重留白，避免过度装饰
3. 字体：使用简洁的黑体字，标题有力，正文清晰
4. 图表：数据展示清晰，图表简洁专业
5. 整体：专业、商务、有品质感

适用场景：
- 企业汇报
- 产品介绍
- 技术分享
- 管理报告
`;
