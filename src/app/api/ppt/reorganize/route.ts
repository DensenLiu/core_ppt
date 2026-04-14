import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { parsePPTX, extractedTextToString } from '@/lib/pptParser';
import { reorganizeContentWithLogic } from '@/lib/miniMaxClient';
import type { ImageData } from '@/types/ppt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, userLogic, targetPageCount, hasReferenceStyle } = body as {
      filePath: string;
      userLogic: string;
      targetPageCount: number;
      hasReferenceStyle?: boolean;
      referenceFilePath?: string;
    };

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    if (!targetPageCount || targetPageCount < 1 || targetPageCount > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid target page count' },
        { status: 400 }
      );
    }

    console.log('[Reorganize] Reading PPT file:', filePath);

    // 读取并解析原始PPT
    const parsedPPT = await parsePPTX(filePath);
    const originalContent = extractedTextToString(parsedPPT);

    console.log('[Reorganize] PPT parsed, content length:', originalContent.length);
    console.log('[Reorganize] User logic:', userLogic);
    console.log('[Reorganize] Target pages:', targetPageCount);

    // 直接使用用户逻辑 + 原始内容，让AI重新生成
    const reorganizedContent = await reorganizeContentWithLogic(
      originalContent,
      userLogic || '保持原文逻辑结构，只做精简',
      targetPageCount,
      !!hasReferenceStyle
    );

    console.log('[Reorganize] AI reorganization successful, slides:', reorganizedContent.slides.length);

    // 收集每个原始幻灯片的图像数据
    const slideImagesMap: { slideIndex: number; images: ImageData[] }[] = [];
    for (let i = 0; i < parsedPPT.slides.length; i++) {
      const images = parsedPPT.slides[i].images || [];
      if (images.length > 0) {
        slideImagesMap.push({ slideIndex: i, images });
        console.log(`[Reorganize] Original slide ${i + 1} has ${images.length} images`);
      }
    }

    const totalImages = slideImagesMap.reduce((sum, item) => sum + item.images.length, 0);
    console.log('[Reorganize] Total images found:', totalImages);

    // 智能分配图片到新幻灯片
    // 策略：按比例分配，保持原PPT中图片分布的密度
    if (totalImages > 0) {
      const originalSlideCount = parsedPPT.slides.length;
      const targetSlideCount = reorganizedContent.slides.length;

      // 计算原PPT中有图片的页面比例
      const imageDensity = slideImagesMap.length / originalSlideCount;
      // 计算新PPT应该有多少页有图片（保持相同密度），最少保证1页有图
      const targetPagesWithImages = Math.max(1, Math.round(imageDensity * targetSlideCount));
      console.log(`[Reorganize] Image density: ${imageDensity.toFixed(2)}, target pages with images: ${targetPagesWithImages}`);

      // 将图片展开成一维数组，按顺序分配到各页
      const allImagesFlat: ImageData[] = slideImagesMap.flatMap(entry => entry.images);
      console.log(`[Reorganize] Total images to distribute: ${allImagesFlat.length}`);

      const newSlides = reorganizedContent.slides.map((slide, idx) => {
        // 只在前 targetPagesWithImages 页中分配图片，每页最多1张
        if (idx >= targetPagesWithImages) {
          return { ...slide, images: undefined };
        }

        // 按顺序取图片
        const imgIndex = idx;
        if (imgIndex < allImagesFlat.length) {
          return {
            ...slide,
            images: [allImagesFlat[imgIndex]], // 每页最多1张图片
          };
        }

        return { ...slide, images: undefined };
      });

      console.log(`[Reorganize] Assigned images to slides: ${newSlides.filter(s => s.images).map((_, i) => i + 1).join(', ')}`);

      return NextResponse.json({
        success: true,
        data: {
          ...reorganizedContent,
          slides: newSlides,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: reorganizedContent,
    });
  } catch (error) {
    console.error('Reorganization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Reorganization failed',
      },
      { status: 500 }
    );
  }
}
