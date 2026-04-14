/**
 * 中国移动风格 PPT 模板
 * 特点：稳重、专业、值得信赖、连接感
 */

import type { PPTStyle } from '@/types/ppt';

export const CHINAMOBILE_STYLE: PPTStyle = {
  id: 'chinamobile',
  name: '移动风格',
  description: '稳重专业、值得信赖，具有通信行业特色',
  category: 'business',

  // 中国移动品牌色 - 移动蓝 + 绿色
  colors: {
    primary: '0095D9',      // 中国移动蓝
    secondary: '00A0E9',    // 亮蓝辅助
    accent: '00C853',       // 绿色点缀（连接、沟通）
    background: 'F5F7FA',   // 淡灰蓝背景
    text: '2D3748',         // 深灰文字
    textLight: 'FFFFFF',    // 浅色文字
  },

  // 字体配置 - 清晰易读
  fonts: {
    title: 'Microsoft YaHei',
    body: 'Microsoft YaHei',
  },

  // 字号配置
  sizes: {
    title: 34,
    subtitle: 20,
    body: 13,
    small: 10,
  },

  // 布局配置
  layout: {
    titleY: 0.35,
    contentY: 1.2,
    marginX: 0.6,
    marginY: 0.4,
  },

  // 装饰元素
  decorations: {
    showTopBar: true,
    showBottomBar: true,
    showPageNumber: true,
    dividerStyle: 'gradient',
  },
};

/**
 * 中国移动风格的特点说明
 */
export const CHINAMOBILE_STYLE_GUIDE = `
中国移动风格特点：
1. 配色：主色调为中国移动蓝(0095D9)，搭配亮蓝和绿色点缀
2. 布局：稳重专业，注重层次感
3. 字体：清晰易读，标题醒目
4. 图表：数据展示清晰，图表规范
5. 整体：值得信赖、连接沟通、行业专业

适用场景：
- 企业汇报
- 业务介绍
- 网络架构
- 客户演示
- 战略规划
`;
