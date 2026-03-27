import { create } from 'zustand';

type LLMProvider = 'openai' | 'anthropic' | 'custom';

interface SettingsState {
  llmProvider: LLMProvider;
  llmApiKey: string;
  llmModel: string;
  llmBaseUrl: string;
  deepgramApiKey: string;
  elevenLabsApiKey: string;
  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  saveAll: () => void;
  loadAll: () => void;
}

const STORAGE_KEY = 'ta_desktop_settings';

function loadFromStorage(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // localStorage blocked or corrupt
  }
  return {};
}

function saveToStorage(state: Partial<SettingsState>) {
  try {
    const data = {
      llmProvider: state.llmProvider,
      llmApiKey: state.llmApiKey,
      llmModel: state.llmModel,
      llmBaseUrl: state.llmBaseUrl,
      deepgramApiKey: state.deepgramApiKey,
      elevenLabsApiKey: state.elevenLabsApiKey,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage blocked
  }
}

const defaults = loadFromStorage();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  llmProvider: (defaults.llmProvider as LLMProvider) || 'openai',
  llmApiKey: (defaults.llmApiKey as string) || '',
  llmModel: (defaults.llmModel as string) || 'gpt-4o',
  llmBaseUrl: (defaults.llmBaseUrl as string) || '',
  deepgramApiKey: (defaults.deepgramApiKey as string) || '',
  elevenLabsApiKey: (defaults.elevenLabsApiKey as string) || '',

  setSetting: (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);
  },

  saveAll: () => {
    saveToStorage(get());
  },

  loadAll: () => {
    const stored = loadFromStorage();
    if (stored.llmProvider) set({ llmProvider: stored.llmProvider as LLMProvider });
    if (stored.llmApiKey !== undefined) set({ llmApiKey: stored.llmApiKey as string });
    if (stored.llmModel !== undefined) set({ llmModel: stored.llmModel as string });
    if (stored.llmBaseUrl !== undefined) set({ llmBaseUrl: stored.llmBaseUrl as string });
    if (stored.deepgramApiKey !== undefined) set({ deepgramApiKey: stored.deepgramApiKey as string });
    if (stored.elevenLabsApiKey !== undefined) set({ elevenLabsApiKey: stored.elevenLabsApiKey as string });
  },
}));

export type { LLMProvider };
export default useSettingsStore;
