import { create } from 'zustand';
import type {
  UploadedFile,
  PPTAnalysis,
  ReorganizedContent,
  StyleConfig,
} from '@/types/ppt';

interface PPTStore {
  // Upload state
  originalFile: UploadedFile | null;
  referenceFile: UploadedFile | null;

  // Analysis state
  analysis: PPTAnalysis | null;
  isAnalyzing: boolean;

  // Reorganization state
  userLogic: string;
  targetPageCount: number;
  reorganizedContent: ReorganizedContent | null;
  isReorganizing: boolean;

  // Generation state
  generatedFileId: string | null;
  generatedFileName: string | null;
  isGenerating: boolean;

  // Style state
  selectedStyle: 'reference' | 'builtin';
  builtinStyle: string;
  referenceStyle: StyleConfig | null;

  // UI state
  currentStep: number;
  error: string | null;

  // Actions
  setOriginalFile: (file: UploadedFile | null) => void;
  setReferenceFile: (file: UploadedFile | null) => void;
  setReferenceStyle: (style: StyleConfig | null) => void;
  setAnalysis: (analysis: PPTAnalysis | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setUserLogic: (logic: string) => void;
  setTargetPageCount: (count: number) => void;
  setReorganizedContent: (content: ReorganizedContent | null) => void;
  setIsReorganizing: (isReorganizing: boolean) => void;
  setGeneratedFile: (fileId: string | null, fileName: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setSelectedStyle: (style: 'reference' | 'builtin') => void;
  setBuiltinStyle: (style: string) => void;
  setCurrentStep: (step: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  originalFile: null,
  referenceFile: null,
  analysis: null,
  isAnalyzing: false,
  userLogic: '',
  targetPageCount: 15,
  reorganizedContent: null,
  isReorganizing: false,
  generatedFileId: null,
  generatedFileName: null,
  isGenerating: false,
  selectedStyle: 'builtin' as const,
  builtinStyle: 'business-blue' as string,
  referenceStyle: null,
  currentStep: 1,
  error: null,
};

export const usePPTStore = create<PPTStore>((set) => ({
  ...initialState,

  setOriginalFile: (file) => set({ originalFile: file }),
  setReferenceFile: (file) => set({ referenceFile: file }),
  setReferenceStyle: (style) => set({ referenceStyle: style }),
  setAnalysis: (analysis) => set({ analysis }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setUserLogic: (logic) => set({ userLogic: logic }),
  setTargetPageCount: (count) => set({ targetPageCount: count }),
  setReorganizedContent: (content) => set({ reorganizedContent: content }),
  setIsReorganizing: (isReorganizing) => set({ isReorganizing }),
  setGeneratedFile: (fileId, fileName) =>
    set({ generatedFileId: fileId, generatedFileName: fileName }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setBuiltinStyle: (style) => set({ builtinStyle: style }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
