# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **PPT Intelligent Generator** - a Next.js 16 web application that uses AI (MiniMax) to:
1. Upload original PPT files
2. Analyze and extract content using AI
3. Reorganize/reduce content based on user logic
4. Generate a streamlined PPT with selected styling

## Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000

# Production
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand (`src/store/pptStore.ts`)
- **AI Integration**: MiniMax API (`src/lib/miniMaxClient.ts`)
- **PPTX Parsing**: JSZip (`src/lib/pptParser.ts`)
- **PPTX Generation**: PptxGenJS (`src/lib/pptGenerator.ts`)
- **Styling**: Tailwind CSS v4

### Data Flow

```
[Upload] → [Analyze AI] → [Reorganize AI] → [Generate PPT]
   ↓            ↓              ↓               ↓
FileUpload  LogicInput    StyleSelector   ResultDisplay
   ↓            ↓              ↓               ↓
  /api/ppt/   /api/ppt/     /api/ppt/      /api/ppt/
   upload     analyze      reorganize      generate
```

### Key Files

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Main UI orchestrator |
| `src/store/pptStore.ts` | Global state management |
| `src/lib/miniMaxClient.ts` | AI analysis & reorganization |
| `src/lib/pptParser.ts` | Parse PPTX to text |
| `src/lib/pptGenerator.ts` | Generate PPTX from content |
| `src/skills/pptStyles.ts` | Built-in style templates |
| `src/app/api/ppt/*.ts` | API routes |

### API Endpoints

- `POST /api/ppt/upload` - Upload original + optional reference PPT
- `POST /api/ppt/analyze` - Analyze PPT content with AI
- `POST /api/ppt/reorganize` - Reorganize content based on logic
- `POST /api/ppt/generate` - Generate final PPT
- `GET /api/ppt/download` - Download generated file

### Style Templates

Located in `src/skills/pptStyles.ts` with categories:
- Business: `business-blue`, `business-gold`
- Tech: `tech-green`, `tech-dark`
- Personal: `personal-warm`, `personal-minimal`
- Creative: `creative-purple`, `creative-orange`

## Environment Variables

Required in `.env.local`:
- `MINIMAX_API_KEY` - MiniMax API key
- `MINIMAX_BASE_URL` - API base URL (default: https://api.minimax.chat/v1)
- `MINIMAX_MODEL` - Model name (default: abab6.5s)

## Key Patterns

1. **Store-first UI**: All state managed via Zustand store, components read from store
2. **Step-based workflow**: 4-step process (upload → logic → style → result)
3. **Fallback on AI failure**: API routes provide fallback data if AI fails
4. **File storage**: Uploaded files stored in `uploads/`, generated files in `output/`
