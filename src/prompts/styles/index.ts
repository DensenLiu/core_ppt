/**
 * 品牌风格模板导出
 */

import type { PPTStyle } from '@/types/ppt';
import { HUAWEI_STYLE, HUAWEI_STYLE_GUIDE } from './huawei';
import { CHINAMOBILE_STYLE, CHINAMOBILE_STYLE_GUIDE } from './chinamobile';

export { HUAWEI_STYLE, HUAWEI_STYLE_GUIDE };
export { CHINAMOBILE_STYLE, CHINAMOBILE_STYLE_GUIDE };

/**
 * 所有品牌风格
 */
export const BRAND_STYLES: Record<string, PPTStyle> = {
  'huawei': HUAWEI_STYLE,
  '华为': HUAWEI_STYLE,
  'chinamobile': CHINAMOBILE_STYLE,
  '移动': CHINAMOBILE_STYLE,
  '中国移动': CHINAMOBILE_STYLE,
};

/**
 * 风格说明
 */
export const STYLE_GUIDES: Record<string, string> = {
  'huawei': HUAWEI_STYLE_GUIDE,
  '华为': HUAWEI_STYLE_GUIDE,
  'chinamobile': CHINAMOBILE_STYLE_GUIDE,
  '移动': CHINAMOBILE_STYLE_GUIDE,
  '中国移动': CHINAMOBILE_STYLE_GUIDE,
};

/**
 * 根据关键词获取风格
 */
export function getBrandStyle(keyword: string): PPTStyle | null {
  const lower = keyword.toLowerCase();

  // 华为
  if (lower.includes('华为') || lower.includes('huawei')) {
    return HUAWEI_STYLE;
  }

  // 中国移动
  if (lower.includes('移动') || lower.includes('cmcc') || lower.includes('chinamobile')) {
    return CHINAMOBILE_STYLE;
  }

  return null;
}

/**
 * 获取风格说明
 */
export function getStyleGuide(keyword: string): string | null {
  const lower = keyword.toLowerCase();

  if (lower.includes('华为') || lower.includes('huawei')) {
    return HUAWEI_STYLE_GUIDE;
  }

  if (lower.includes('移动') || lower.includes('cmcc') || lower.includes('chinamobile')) {
    return CHINAMOBILE_STYLE_GUIDE;
  }

  return null;
}
