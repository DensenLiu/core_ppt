# PPT智能生成工具 - 设计文档

## 1. 项目概述

### 1.1 项目背景

本项目是一个基于 AI 的 PPT 智能生成工具，主要用于将冗长的评估报告 PPT 精简为适合客户汇报的版本。

### 1.2 核心功能

1. **文件上传** - 支持上传原始 PPT 和参考样式 PPT
2. **输入汇报逻辑** - 用户输入期望的汇报逻辑（不再自动分析）
3. **AI 重组生成** - 根据用户逻辑 + 原始内容，重新生成新 PPT
4. **样式生成** - 支持 8 种内置样式模板，或提取参考 PPT 的样式
5. **下载输出** - 生成精简后的 PPT 文件供下载

### 1.3 目标用户

- 需要将长篇报告精简为演示文稿的业务人员
- 需要快速生成汇报 PPT 的专业人员

---

## 2. 技术架构

### 2.1 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| Next.js | Web 框架 | 16.1.7 |
| React | UI 库 | 19.2.3 |
| Zustand | 状态管理 | 5.0.12 |
| Tailwind CSS | 样式框架 | v4 |
| PptxGenJS | PPT 生成 | 4.0.1 |
| JSZip | PPT 解析 | 3.10.1 |
| MiniMax API | AI 能力 | - |

### 2.2 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── ppt/
│   │       ├── upload/       # 上传接口
│   │       ├── analyze/      # 分析接口
│   │       ├── reorganize/   # 重组接口
│   │       ├── generate/     # 生成接口
│   │       └── download/     # 下载接口
│   ├── globals.css         # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── FileUpload.tsx     # 文件上传组件
│   ├── LogicInput.tsx     # 逻辑输入组件
│   ├── StyleSelector.tsx  # 样式选择组件
│   ├── ResultDisplay.tsx  # 结果展示组件
│   └── StepIndicator.tsx  # 步骤指示器
├── lib/                   # 核心库
│   ├── pptParser.ts       # PPT 解析
│   ├── pptGenerator.ts   # PPT 生成
│   ├── miniMaxClient.ts  # MiniMax API 客户端
│   ├── fileUtils.ts      # 文件工具
│   └── styleExtractor.ts  # 样式提取
├── skills/                # 技能/模板
│   └── pptStyles.ts      # PPT 样式模板
├── store/                 # 状态管理
│   └── pptStore.ts       # Zustand store
├── types/                 # 类型定义
│   └── ppt.ts            # 类型声明
└── app/                  # 应用入口
    └── ...
```

### 2.3 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ FileUpload  │  │ LogicInput  │  │StyleSelector│           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          ▼                                      │
│                   ┌─────────────┐                                │
│                   │ pptStore    │  (Zustand 状态管理)           │
│                   └──────┬──────┘                                │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                           │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐          │
│  │ /upload │  │/analyze │  │/reorganize│  │/generate│          │
│  └────┬────┘  └────┬────┘  └─────┬─────┘  └────┬────┘          │
└───────┼────────────┼─────────────┼──────────────┼───────────────┘
        │            │             │              │
        ▼            ▼             ▼              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Services                                  │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐                 │
│  │fs/multer │  │MiniMax API │  │ PptxGenJS  │                 │
│  │(文件存储) │  │  (AI分析)   │  │  (PPT生成)  │                 │
│  └─────┬────┘  └──────┬─────┘  └──────┬──────┘                 │
│        │               │                │                         │
│        ▼               ▼                ▼                         │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐                  │
│  │uploads/  │  │ PPT Parser │  │   output/   │                  │
│  │ (原始)   │  │ (JSZip)    │  │  (生成结果)  │                  │
│  └──────────┘  └────────────┘  └─────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. 功能模块设计

### 3.1 用户流程

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Step 1    │     │  Step 2    │     │  Step 3    │     │  Step 4    │
│  上传文件   │────▶│  输入逻辑   │────▶│  选择样式   │────▶│  生成PPT   │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
  FileUpload         LogicInput         StyleSelector        ResultDisplay
                  /api/ppt/                              /api/ppt/generate
                   reorganize
                   (含PPT解析)
```

### 3.1.1 核心流程说明

1. **上传文件** → 用户上传原始 PPT
2. **输入汇报逻辑** → 用户输入期望的汇报逻辑（如"按风险等级从高到低排序"）
3. **AI 重组生成**（关键变化）：
   - 不再自动分析
   - 直接读取原始 PPT 内容
   - 结合用户逻辑，从零重新生成 PPT 内容
   - 80% 来自原文，10% 合理推断（标题、过渡语）
4. **选择样式** → 用户选择 8 种内置样式之一
5. **生成 PPT** → 生成最终的 PPTX 文件

### 3.2 模块详细设计

#### 3.2.1 文件上传模块 (FileUpload)

**功能**：
- 支持上传原始 PPT 文件（必选）
- 支持上传参考样式 PPT 文件（可选）
- 文件格式校验：仅支持 `.pptx`
- 文件大小限制：50MB

**前端组件**：
- 文件选择器（点击/拖拽）
- 文件预览
- 上传进度显示

**后端 API**：`POST /api/ppt/upload`

**请求**：
```typescript
FormData {
  original: File,      // 原始 PPT 文件
  reference?: File    // 参考样式文件（可选）
}
```

**响应**：
```typescript
{
  success: true,
  data: {
    original: {
      id: string,
      fileName: string,
      originalName: string,
      filePath: string,
      uploadedAt: Date,
      type: 'original'
    },
    reference?: {...}
  }
}
```

#### 3.2.2 内容分析模块 (Analysis)

**功能**：
- 解析 PPT 文件，提取文本内容
- 调用 AI 分析内容结构
- 提取关键信息和数据
- 识别 PPT 类型和风格

**处理流程**：
```
PPTX 文件 ──▶ JSZip 解析 ──▶ 提取文本 ──▶ MiniMax AI 分析 ──▶ 结构化数据
```

**AI 分析输出**：
```typescript
{
  originalType: string,           // PPT 类型
  originalStructure: string[],   // 原文结构
  keyPoints: [{                   // 关键要点
    section: string,
    summary: string,
    originalContent: string[]
  }],
  data: {                        // 数据和结论
    metrics: string[],
    conclusions: string[]
  },
  style: {                       // 风格
    tone: string,
    format: string
  }
}
```

**降级策略**：若 AI 分析失败，使用默认通用格式

#### 3.2.3 逻辑重组模块 (Reorganization) - 核心变化

**重要变化**：不再单独分析阶段，用户输入逻辑后直接重组生成。

**处理流程**：
```
用户输入汇报逻辑
        │
        ▼
┌─────────────────────────────┐
│  读取原始 PPT 文件           │
│  解析为文本内容              │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  AI 重组生成                 │
│  - 输入: 原始内容 + 用户逻辑 │
│  - 输出: 全新 PPT 大纲      │
└─────────────────────────────┘
```

**用户输入**：
- 汇报逻辑（文本描述）
- 目标页数（5-30 页，默认 15 页）

**预设建议**：
- 按风险等级从高到低排序
- 先讲架构概述，再讲评估结果，最后给建议
- 按评估维度分组，每维度一页
- 重点突出高风险问题和建议
- 按问题严重程度排序，先急后缓
- 总分总结构：概述→详情→总结

**AI 重组原则**：
- **80%**：从原文提取关键信息（数据、结论、要点）
- **10%**：标题、过渡语的合理推断
- **10%**：逻辑衔接和表达优化

**内容密度要求**：
- 每页至少 3-5 个要点
- 不能是空洞的短句
- 每个要点要包含具体信息
- 数据、指标、结论保留原文具体值

**AI 重组输出**：
```typescript
{
  slides: [{
    title: string,        // 简洁有力的标题
    content: string[],    // 3-5个充实要点
    section?: string      // 所属章节（可选）
  }]
}
```

#### 3.2.4 样式选择模块 (Style Selection)

**内置样式**（8 种）：

| ID | 名称 | 类别 | 主色 |
|----|------|------|------|
| business-blue | 商务蓝 | Business | #1F4E78 |
| business-gold | 尊享金 | Business | #B8860B |
| tech-green | 科技绿 | Tech | #00A86B |
| tech-dark | 暗夜科技 | Tech | #00BCD4 |
| personal-warm | 温暖个人 | Personal | #FF7043 |
| personal-minimal | 简约个人 | Personal | #5C6BC0 |
| creative-purple | 梦幻紫 | Creative | #7C4DFF |
| creative-orange | 活力橙 | Creative | #FF5722 |

**样式配置结构**：
```typescript
interface PPTStyle {
  id: string;
  name: string;
  category: 'business' | 'personal' | 'tech' | 'creative';

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textLight: string;
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

  decorations: {
    showTopBar: boolean;
    showBottomBar: boolean;
    showPageNumber: boolean;
    dividerStyle: 'line' | 'gradient' | 'none';
  };
}
```

#### 3.2.5 PPT 生成模块 (Generation)

**使用库**：PptxGenJS

**生成配置**：
- 幻灯片比例：16:9
- 布局：LAYOUT_16x9

**核心特点**：根据内容数量和图片分布，动态选择最合适的布局模板。

**动态布局选择策略**：

系统内置 11 种布局模板（详见 `pptLayouts.ts`），根据以下规则自动选择：

1. **根据内容数量**：
   - ≤3 条内容 → 单栏布局（内容更突出）
   - 4-6 条内容 → 双栏布局（充分利用空间）
   - ≥7 条内容 → 三栏布局（避免拥挤）

2. **根据是否有图片**：
   - 有图片时，图片作为独立内容区，占据自己的区域（如左上文右下图的右下区域）
   - 无图片时，文本区域占满内容区
   - 布局模板中的 `type: 'image'` 区域专门用于放置图片，避免与文字重叠

3. **根据 layout 字段**：
   - 用户明确指定 layout 时，优先使用对应模板
   - cover/transition/table/chart 使用专用渲染函数

**布局模板示例**：

```
左右双栏 (two-column):
┌─────────────────────────┐
│        标题              │
├───────────┬─────────────┤
│           │             │
│   左栏    │    右栏     │
│           │             │
└───────────┴─────────────┘

三栏布局 (three-column):
┌─────────────────────────┐
│        标题              │
├───────┬───────┬─────────┤
│       │       │         │
│  栏1  │  栏2  │   栏3   │
│       │       │         │
└───────┴───────┴─────────┘

单栏布局 (single-column):
┌─────────────────────────┐
│        标题              │
├─────────────────────────┤
│                         │
│       大面积内容区        │
│                         │
│                         │
└─────────────────────────┘

左上文右下 (left-top-right-bottom) - 图片内容页:
┌─────────────────────────┐
│        标题              │
├────────────┬────────────┤
│  小文本区  │            │
│            │            │
├────────────┤   图片区    │
│            │   (image)  │
│            │            │
└────────────┴────────────┘
注：适用于有图片的内容页，图片独占右下区域，不与文字重叠
```

**动态字号调整**：

```typescript
// 根据内容数量动态调整字号
const dynamicBodySize = Math.max(
  10,                                          // 最小字号
  Math.min(bodySize, 14 - Math.floor(totalContentItems / 10))
);
```

**渲染流程**：

```
选择布局模板
    │
    ▼
┌─────────────────────────────┐
│  渲染背景和装饰元素          │
│  - 背景色块                │
│  - 顶部装饰条              │
│  - 标题下划线装饰          │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  根据模板区域分配内容        │
│  - 分离文本区域和图片区域   │
│  - 文本内容分配到text区域   │
│  - 图片渲染到image区域      │
│  - 动态调整字号            │
│  - 顶部对齐自动换行        │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  渲染图片到图片区域          │
│  - 布局有image区域时使用    │
│  - 按原始比例缩放适应区域   │
│  - 居中放置                │
│  - 无image区域则不渲染      │
└─────────────────────────────┘
```

**内容分配算法**：

```typescript
// 将内容均匀分配到各区域
const itemsPerArea = Math.ceil(totalContentItems / textAreas.length);

for (let i = 0; i < textAreas.length; i++) {
  const areaContent = contentItems.slice(
    itemIndex,
    itemIndex + itemsPerArea
  );
  itemIndex += itemsPerArea;
}
```

**图片渲染规则**：

- 图片作为内容的一部分，占据独立区域（不是统一放置在底部）
- 使用布局模板的 `type: 'image'` 区域来放置图片
- 按原始宽高比缩放以适应区域
- 居中放置在对应区域内
- 如果布局模板没有 `type: 'image'` 区域，则不在该布局中渲染图片
- 保持原始PPT中的图片分布密度（有图片的页数比例）

#### 3.2.6 下载模块

**API**：`GET /api/ppt/download?path=...&name=...`

**响应**：
- Content-Type: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- Content-Disposition: `attachment`

---

## 4. 数据流设计

### 4.1 完整数据流

```
用户操作                    API 调用                    外部服务                 文件系统
  │                          │                          │                        │
  ├── 选择原始文件 ─────────▶│                          │                        │
  │                          ├── POST /upload ────────▶│                        │
  │                          │                          │                        ├── uploads/
  │                          │◀─────────────────────────┤                        │
  │                          │                          │                        │
  │                          ├── 自动触发分析 ─────────▶│                        │
  │                          ├── POST /analyze ────────▶│──▶ MiniMax API         │
  │                          │                          │                        │
  │                          │◀─────────────────────────┤                        │
  │◀─────────────────────────┤                          │                        │
  │                          │                          │                        │
  ├── 输入汇报逻辑 ──────────▶│                          │                        │
  │                          ├── POST /reorganize ─────▶│──▶ MiniMax API         │
  │                          │                          │                        │
  │                          │◀─────────────────────────┤                        │
  │◀─────────────────────────┤                          │                        │
  │                          │                          │                        │
  ├── 选择样式 ──────────────▶│                          │                        │
  │                          ├── POST /generate ───────▶│──▶ PptxGenJS           │
  │                          │                          │                        │
  │                          │                          │                        ├── output/
  │                          │◀─────────────────────────┤                        │
  │                          │                          │                        │
  ├── 点击下载 ──────────────▶│                          │                        │
  │                          ├── GET /download ─────────▶│                        │
  │                          │◀─────────────────────────┤                        │
  │◀─────────────────────────┤                          │                        │
```

### 4.2 状态管理 (Zustand)

**Store 结构**：
```typescript
interface PPTStore {
  // 上传状态
  originalFile: UploadedFile | null;
  referenceFile: UploadedFile | null;

  // 分析状态
  analysis: PPTAnalysis | null;
  isAnalyzing: boolean;

  // 重组状态
  userLogic: string;
  targetPageCount: number;
  reorganizedContent: ReorganizedContent | null;
  isReorganizing: boolean;

  // 生成状态
  generatedFileId: string | null;
  generatedFileName: string | null;
  isGenerating: boolean;

  // 样式状态
  selectedStyle: 'reference' | 'builtin';
  builtinStyle: string;
  extractedStyle: StyleConfig | null;

  // UI 状态
  currentStep: number;
  error: string | null;
}
```

---

## 5. API 接口设计

### 5.1 接口列表

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/ppt/upload | 上传文件 |
| POST | /api/ppt/analyze | 分析内容 |
| POST | /api/ppt/reorganize | 重组内容 |
| POST | /api/ppt/generate | 生成 PPT |
| GET | /api/ppt/download | 下载文件 |

### 5.2 统一响应格式

**成功响应**：
```typescript
{
  success: true,
  data: { ... }
}
```

**失败响应**：
```typescript
{
  success: false,
  error: string
}
```

---

## 6. 环境配置

### 6.1 环境变量

在 `.env.local` 中配置：

```bash
# MiniMax API 配置
MINIMAX_API_KEY=your-api-key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
MINIMAX_MODEL=MiniMax-M2.5

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.2 目录权限

确保以下目录有写权限：
- `uploads/` - 上传文件存储
- `output/` - 生成文件存储

---

## 7. 错误处理

### 7.1 错误类型

| 错误类型 | 处理方式 |
|----------|----------|
| 文件格式错误 | 前端提示，仅支持 .pptx |
| 文件大小超限 | 前端提示，最大 50MB |
| AI 分析失败 | 使用默认通用格式降级 |
| 文件读取失败 | 返回具体错误信息 |
| PPT 生成失败 | 返回错误并清理临时文件 |

### 7.2 降级策略

当 AI 服务不可用时：
- 分析接口返回默认结构化数据
- 重组接口基于默认分析结果生成简化版本

---

## 8. 页面设计

### 8.1 主页面布局

```
┌─────────────────────────────────────────────────────┐
│  [Logo] PPT智能生成工具                              │
│        将冗长的评估PPT精简为适合客户汇报的版本         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───┐   ┌───┐   ┌───┐   ┌───┐                    │
│  │ 1 │──▶│ 2 │──▶│ 3 │──▶│ 4 │   步骤指示器       │
│  └───┘   └───┘   └───┘   └───┘                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │              步骤内容区域                     │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Powered by MiniMax AI                             │
└─────────────────────────────────────────────────────┘
```

### 8.2 颜色主题

```css
:root {
  --primary: #1F4E78;       /* 主色 - 商务蓝 */
  --primary-hover: #2c6a9e; /* 主色悬停 */
  --secondary: #f5f5f5;     /* 次要背景 */
  --border: #e5e5e5;        /* 边框 */
  --success: #22c55e;       /* 成功 */
  --warning: #f59e0b;       /* 警告 */
  --error: #ef4444;         /* 错误 */
}
```

---

## 9. 扩展性设计

### 9.1 添加新样式

在 `src/skills/pptStyles.ts` 的 `STYLE_TEMPLATES` 数组中添加新样式对象。

### 9.2 添加新 AI 供应商

在 `src/lib/` 下创建新的 AI 客户端模块，替换 `miniMaxClient.ts`。

### 9.3 添加新功能

1. 在 `src/types/ppt.ts` 添加类型定义
2. 在 `src/store/pptStore.ts` 添加状态和 action
3. 创建对应的组件
4. 在 `src/app/api/ppt/` 添加对应的 API 路由

---

## 10. 部署注意事项

### 10.1 生产环境

```bash
npm run build
npm run start
```

### 10.2 环境变量

生产环境必须配置：
- `MINIMAX_API_KEY`
- `MINIMAX_BASE_URL`

### 10.3 文件清理

建议定期清理 `uploads/` 和 `output/` 目录中的临时文件。

---

## 11. 视觉元素设计

### 11.1 概述

生成的 PPT 包含丰富的视觉元素，包括封面、过渡页、内容页、表格页、图表页等。支持从原 PPT 中提取并保留图片、表格等视觉元素。

### 11.2 布局类型

| 布局类型 | 说明 | 使用场景 |
|----------|------|----------|
| `cover` | 封面布局 | 首页、结尾页 |
| `transition` | 过渡页 | 章节切换 |
| `content` | 内容页 | 常规内容 |
| `table` | 表格页 | 数据展示 |
| `chart` | 图表页 | 数据可视化 |
| `list` | 列表页 | 目录、要点 |
| `two-column` | 双栏页 | 对比、并列 |

### 11.3 内置布局模板 (pptLayouts.ts)

系统内置 11 种布局模板，用于生成时参考：

| ID | 名称 | 描述 | 适用场景 |
|----|------|------|----------|
| `two-column` | 左右双栏 | 标题 + 左右两栏 | 对比、分类 |
| `top-bottom` | 上下双栏 | 标题 + 上下两栏 | 总-分结构 |
| `three-column` | 三栏布局 | 标题 + 三栏并列 | 三点并列、对比 |
| `single-column` | 单栏布局 | 标题 + 大面积内容 | 详细内容说明 |
| `left-sidebar` | 左侧栏 | 左侧窄栏 + 右侧内容 | 目录、导航 |
| `title-top-three-bottom` | 上标题下三栏 | 标题区 + 三栏 | 多要点总结 |
| `two-column-bottom-bar` | 双栏+底部总结 | 左右双栏 + 底部总结条 | 章节结尾 |
| `three-column-bottom-bar` | 三栏+底部总结 | 三栏 + 底部总结条 | 章节结尾 |
| `cover` | 封面 | 大标题居中 | 章节封面 |
| `transition` | 过渡页 | 大标题居中 | 章节分隔 |
| `left-top-right-bottom` | 左上文右下 | 左上小区域 + 右下大面积 | 补充说明 |

**布局选择策略**：
- 根据内容数量自动选择：少内容 → 单栏，多内容 → 多栏
- 根据是否有图片调整：单栏或双栏 + 底部图片

### 11.4 背景类型

| 背景类型 | 说明 |
|----------|------|
| `solid` | 纯色背景 |
| `gradient` | 渐变背景（通过色块模拟） |
| `image` | 图片背景 |
| `none` | 无特殊背景 |

### 11.5 数据结构

#### 表格数据
```typescript
interface TableData {
  title: string;      // 表格标题
  headers: string[];   // 表头
  rows: string[][];    // 数据行
}
```

#### 图表数据
```typescript
interface ChartData {
  type: 'bar' | 'column' | 'pie' | 'line';
  title: string;
  categories: string[];  // 分类
  series: { name: string; values: number[] }[];
}
```

#### 列表项
```typescript
interface ListItem {
  title: string;
  content: string;
  highlight?: boolean;  // 是否高亮
}
```

#### 图片数据
```typescript
interface ImageData {
  id: string;
  name: string;
  originalPath: string;           // PPTX 内部路径
  position: { x: number; y: number; cx: number; cy: number }; // 位置和尺寸
  placeholder?: string;            // 外部链接图片的描述
  base64?: string;                // 图片的 base64 编码数据
}
```

### 11.6 AI 生成策略

AI 在生成内容时会根据以下规则选择布局：

1. **首页**：自动使用封面布局（cover）
2. **章节过渡**：使用过渡布局（transition）
3. **数据展示**：优先使用表格（table）或图表（chart）
4. **对比内容**：使用双栏布局（two-column）
5. **目录/要点**：使用列表布局（list）
6. **常规内容**：根据内容数量选择单栏/双栏/三栏

### 11.7 幻灯片结构建议

推荐的页面分布：
- 第1页：封面（cover）- 标题、副标题、汇报人、日期
- 第2页：目录（list）- 展示汇报的主要章节
- 第3-N-2页：内容页（content/table/chart）- 核心内容
- 第N-1页：总结（content）- 核心要点回顾
- 第N页：致谢（cover）- 致谢/Q&A

---

## 12. 后续扩展

### 12.1 可添加的视觉元素

1. **真实图表**：目前图表用表格模拟，后续可集成真实图表库
2. **背景图片**：支持上传背景图片或使用模板
3. **动画效果**：添加简单的切换动画
4. **多列布局**：支持更多列的复杂布局

### 12.2 AI 增强方向

1. **智能配图**：根据内容自动选择相关图片
2. **图表优化**：更准确的图表类型建议
3. **颜色方案**：根据内容自动调整配色
4. **布局优化**：根据内容密度自动选择最佳布局

---

## 13. PPT 解析模块 (pptParser.ts)

### 13.1 功能概述

PPT 解析模块负责从 PPTX 文件中提取各种内容元素，包括文本、表格、图表、图片等。

### 13.2 解析能力

| 内容类型 | 状态 | 说明 |
|---------|------|------|
| 文本 | ✅ 支持 | 通过 `<a:t>` 标签提取 |
| 外部表格 | ✅ 支持 | 独立 table XML 文件 |
| 内嵌表格 | ✅ 支持 | 直接存在于 slide XML 中的 `<a:tbl>` |
| 外部图表 | ✅ 支持 | 独立 chart XML 文件 |
| 图片 | ✅ 支持 | `<p:pic>`、`<p:blip r:embed>` |
| 批注 | ✅ 支持 | notesSlide XML 文件 |

### 13.3 解析流程

```
PPTX 文件 (ZIP格式)
    │
    ▼
┌─────────────────────────────┐
│  解析 presentation.xml     │ 获取幻灯片顺序
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  解析 _rels 文件            │ 建立关系映射
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  逐个解析幻灯片 XML         │
│  - 提取文本内容             │
│  - 提取表格数据             │
│  - 提取图表数据             │
│  - 提取图片数据             │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  输出结构化数据             │
│  - ParsedSlide[]           │
│  - ImageData[] (含 base64) │
└─────────────────────────────┘
```

### 13.4 核心数据结构

```typescript
interface ParsedSlide {
  index: number;              // 幻灯片索引
  title: string;               // 幻灯片标题
  elements: SlideElement[];     // 文本元素
  tables?: TableData[];         // 表格数据
  charts?: ChartData[];        // 图表数据
  images?: ImageData[];         // 图片数据
  notes?: string;               // 批注
}

interface ImageData {
  id: string;
  name: string;
  originalPath: string;
  position: { x: number; y: number; cx: number; cy: number };
  placeholder?: string;
  base64?: string;             // 包含 MIME 类型
}
```

### 13.5 图片解析细节

1. **解析 `<p:pic>` 元素**：从内部的 `<a:blip r:embed="...">` 获取关系 ID
2. **解析关系文件**：从 `slideN.xml.rels` 获取图片实际路径
3. **提取 base64**：从 `ppt/media/` 目录读取图片并转为 base64
4. **位置信息**：从 `<a:off>` 和 `<a:ext>` 提取坐标和尺寸

```javascript
// 图片路径转换示例
"../media/image1.png" → "ppt/media/image1.png"
```

---

## 14. 内容重组模块 (reorganize)

### 14.1 处理流程

```
用户输入汇报逻辑
       │
       ▼
┌─────────────────────────────┐
│  读取原始 PPT 文件           │
│  parsePPTX()                │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  提取文本内容                │
│  extractedTextToString()    │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  AI 重组生成                │
│  reorganizeContentWithLogic()│
│  - 原始内容 + 用户逻辑       │
│  - 输出新 PPT 大纲          │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  智能分配图片               │
│  - 保持原图片分布密度        │
│  - 每页最多 1 张            │
│  - 只分配给前 N 页          │
└─────────────────────────────┘
       │
       ▼
返回 ReorganizedContent
```

### 14.2 图片分配算法

```typescript
// 1. 统计原 PPT 中有图片的页面及其分布
const slideImagesMap = [
  { slideIndex: 0, images: [img1] },  // 第1页
  { slideIndex: 1, images: [img2] },  // 第2页
  { slideIndex: 2, images: [img3] },  // 第3页
  { slideIndex: 3, images: [img4] },  // 第4页
  { slideIndex: 9, images: [img5] },  // 第10页
];

// 2. 计算原 PPT 的图片密度
const imageDensity = 有图片的页数 / 总页数;
// 例如：5/22 ≈ 0.23

// 3. 按密度分配到新 PPT
const targetPagesWithImages = Math.round(imageDensity * targetSlideCount);
// 例如：0.23 * 10 ≈ 2-3 页

// 4. 每页最多 1 张图片
```

### 14.3 AI Prompt 格式要求

为确保 AI 输出符合 PPT 格式，制定了严格的 Prompt 要求：

**正确格式**：
```
第1页：标题
• 要点1：具体内容说明...
• 要点2：具体内容说明...
• 要点3：具体内容说明...

---
第2页：标题
• 要点1：具体内容...
• 要点2：具体内容...
```

**禁止格式**：
```
• **加粗文字**       ← 禁止 Markdown 加粗
• *斜体文字*         ← 禁止斜体
• - 破折号开头       ← 必须用圆点
• **示例**：xxx      ← 禁止解释性格式
```

**内容要求**：
- 每页必须包含实质性内容，不能只是标题
- 每个要点至少 20 字
- 必须包含原文的关键信息、数据、案例
- 不能遗漏原文的核心主体内容

---

## 15. PPT 生成模块 (pptGenerator.ts)

### 15.1 动态布局选择

根据内容数量和是否有图片，系统自动选择最佳布局：

| 内容数量 | 无图片 | 有图片 |
|---------|--------|--------|
| ≤3 条 | 单栏布局 | 单栏+底部图片 |
| 4-6 条 | 双栏布局 | 双栏+底部图片 |
| ≥7 条 | 三栏布局 | 三栏+底部图片 |

### 15.2 字号动态调整

```typescript
const dynamicBodySize = Math.max(10, Math.min(bodySize, 14 - Math.floor(totalContentItems / 10)));
// 内容越多，字号自动减小，确保内容充分展示
```

### 15.3 文本框配置

```typescript
slide.addText(contentText, {
  fontSize: dynamicBodySize,
  lineSpacing: dynamicBodySize * 1.5,
  bullet: false,           // 已在文本中手动添加
  autoFit: true,          // 自动缩小防止溢出
  valign: 'top',           // 顶部对齐
});
```

### 15.4 图片渲染位置

图片统一放置在幻灯片底部区域：
- 单图：居中显示
- 双图：左右分布

```
┌─────────────────────────┐
│        标题              │
├─────────────────────────┤
│                         │
│      文本内容区          │
│                         │
├─────────────────────────┤
│   [图片1]    [图片2]    │  ← 底部图片区
└─────────────────────────┘
```

---

## 16. 目录结构 (最新)

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── ppt/
│   │       ├── upload/       # 上传接口
│   │       ├── analyze/      # 分析接口
│   │       ├── reorganize/  # 重组接口
│   │       ├── generate/    # 生成接口
│   │       └── download/    # 下载接口
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/            # React 组件
├── lib/                   # 核心库
│   ├── pptParser.ts       # PPT 解析 (含图片提取)
│   ├── pptGenerator.ts    # PPT 生成 (含动态布局)
│   ├── miniMaxClient.ts   # MiniMax API 客户端
│   ├── fileUtils.ts
│   └── styleExtractor.ts
├── skills/                # 技能/模板
│   ├── pptStyles.ts      # PPT 样式模板 (8种)
│   └── pptLayouts.ts     # PPT 布局模板 (11种) ★ 新增
├── store/
│   └── pptStore.ts
├── types/
│   └── ppt.ts            # 类型定义 (含 ImageData)
└── prompts/              # AI Prompt 模板 ★ 新增
```

---

## 17. 环境配置

### 17.1 环境变量

```bash
# MiniMax API 配置
MINIMAX_API_KEY=your-api-key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
MINIMAX_MODEL=MiniMax-M2.5

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 17.2 目录权限

确保以下目录有写权限：
- `uploads/` - 上传文件存储
- `output/` - 生成文件存储
