import { NextRequest, NextResponse } from 'next/server';
import { generatePPTX } from '@/lib/pptGenerator';
import { generateFileId } from '@/lib/fileUtils';
import { extractStyleFromPPTX, convertToPPTStyle, extractBackgroundImageFromPPTX, applyThemeColorsToPPTX } from '@/lib/styleExtractor';
import type { ReorganizedContent, StyleConfig } from '@/types/ppt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      styleId,
      referenceFilePath,
      originalFileName,
    } = body as {
      content: ReorganizedContent;
      styleId?: string;
      referenceFilePath?: string;
      originalFileName?: string;
    };

    if (!content || !content.slides || content.slides.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No content provided' },
        { status: 400 }
      );
    }

    // 确定使用的样式
    let finalStyleId = styleId || 'business-blue';
    let extractedStyle: StyleConfig | undefined;
    let backgroundImagePath: string | undefined;
    let styleInfo: any = {};

    // 如果是参考样式，提取样式和背景图片
    if (styleId === 'reference-style' && referenceFilePath) {
      try {
        console.log('[Generate] Extracting style from reference file:', referenceFilePath);
        extractedStyle = await extractStyleFromPPTX(referenceFilePath);
        console.log('[Generate] Extracted style:', JSON.stringify(extractedStyle));

        // 提取背景图片
        const bgImage = await extractBackgroundImageFromPPTX(referenceFilePath);
        if (bgImage) {
          backgroundImagePath = bgImage.path;
          console.log('[Generate] Extracted background image:', backgroundImagePath);
        }

        // 转换为 PPTStyle 用于调试
        const convertedStyle = convertToPPTStyle(extractedStyle);
        styleInfo = {
          type: 'reference',
          themeColor: '#' + convertedStyle.colors.primary,
          backgroundColor: '#' + convertedStyle.colors.background,
          backgroundImage: backgroundImagePath ? 'extracted' : 'none',
          textColor: '#' + convertedStyle.colors.text,
          fontFamily: convertedStyle.fonts.title,
          titleFontSize: convertedStyle.sizes.title,
          bodyFontSize: convertedStyle.sizes.body,
        };
        console.log('[Generate] Converted style info:', JSON.stringify(styleInfo));
      } catch (styleError) {
        console.error('[Generate] Failed to extract style:', styleError);
        // 如果提取失败，使用默认样式
        finalStyleId = 'business-blue';
        styleInfo = { type: 'default', reason: 'extraction_failed' };
      }
    } else {
      styleInfo = { type: 'builtin', styleId: finalStyleId };
    }

    // Generate PPT
    const result = await generatePPTX(
      content,
      finalStyleId,
      originalFileName || 'presentation.pptx',
      extractedStyle,
      backgroundImagePath
    );

    // 如果是参考样式，修改生成PPT的主题色
    if (styleId === 'reference-style' && extractedStyle) {
      try {
        const convertedStyle = convertToPPTStyle(extractedStyle);
        await applyThemeColorsToPPTX(
          result.filePath,
          convertedStyle.colors.primary,
          convertedStyle.fonts.title
        );
        console.log('[Generate] Applied theme colors to PPTX');
      } catch (themeError) {
        console.error('[Generate] Failed to apply theme colors:', themeError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: generateFileId(),
        fileName: result.fileName,
        filePath: result.filePath,
        pageCount: result.pageCount,
        styleId: finalStyleId,
        styleInfo,
      },
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      },
      { status: 500 }
    );
  }
}
