/**
 * Spaced Repetition Store
 *
 * Manages spaced repetition items per role.
 * Persists to localStorage via localStore (Brain storage).
 */
import { create } from 'zustand';
import { localStore } from '@/lib/tauri-compat';
import {
  type SpacedRepItem,
  type Rating,
  type RepStats,
  createSpacedRepItem,
  reviewItem,
  getDueItems as filterDueItems,
  getItemStats,
} from '@/lib/spaced-repetition';

interface SpacedRepetitionState {
  /** All items keyed by roleId */
  items: Record<string, SpacedRepItem[]>;

  /** Add a new review item for a role */
  addItem: (roleId: string, question: string, answer: string, topic?: string) => void;

  /** Add multiple items at once (e.g., after a session ends) */
  addItems: (roleId: string, items: Array<{ question: string; answer: string; topic?: string }>) => void;

  /** Get all items that are due for review for a role */
  getDueItems: (roleId: string) => SpacedRepItem[];

  /** Get all items for a role */
  getAllItems: (roleId: string) => SpacedRepItem[];

  /** Update an item after review with a rating */
  updateItem: (itemId: string, rating: Rating) => void;

  /** Get statistics for a role's items */
  getStats: (roleId: string) => RepStats;

  /** Delete a single item */
  deleteItem: (itemId: string) => void;

  /** Delete all items for a role */
  clearRoleItems: (roleId: string) => void;

  /** Get a count of due items across all roles */
  getTotalDueCount: () => number;
}

const STORAGE_KEY = 'spaced_rep_items';

function loadItems(): Record<string, SpacedRepItem[]> {
  return localStore.get<Record<string, SpacedRepItem[]>>(STORAGE_KEY) || {};
}

function saveItems(items: Record<string, SpacedRepItem[]>): void {
  localStore.set(STORAGE_KEY, items);
}

export const useSpacedRepetitionStore = create<SpacedRepetitionState>((set, get) => ({
  items: loadItems(),

  addItem: (roleId: string, question: string, answer: string, topic?: string) => {
    const current = get().items;
    const roleItems = current[roleId] || [];
    const newItem = createSpacedRepItem(roleId, question, answer, topic);
    const updated = { ...current, [roleId]: [...roleItems, newItem] };
    saveItems(updated);
    set({ items: updated });
  },

  addItems: (roleId: string, newItems: Array<{ question: string; answer: string; topic?: string }>) => {
    const current = get().items;
    const roleItems = current[roleId] || [];
    const created = newItems.map((item) =>
      createSpacedRepItem(roleId, item.question, item.answer, item.topic)
    );
    const updated = { ...current, [roleId]: [...roleItems, ...created] };
    saveItems(updated);
    set({ items: updated });
  },

  getDueItems: (roleId: string) => {
    const roleItems = get().items[roleId] || [];
    return filterDueItems(roleItems);
  },

  getAllItems: (roleId: string) => {
    return get().items[roleId] || [];
  },

  updateItem: (itemId: string, rating: Rating) => {
    const current = get().items;
    const updated: Record<string, SpacedRepItem[]> = {};

    for (const [roleId, roleItems] of Object.entries(current)) {
      updated[roleId] = roleItems.map((item) => {
        if (item.id === itemId) {
          return reviewItem(item, rating);
        }
        return item;
      });
    }

    saveItems(updated);
    set({ items: updated });
  },

  getStats: (roleId: string) => {
    const roleItems = get().items[roleId] || [];
    return getItemStats(roleItems);
  },

  deleteItem: (itemId: string) => {
    const current = get().items;
    const updated: Record<string, SpacedRepItem[]> = {};

    for (const [roleId, roleItems] of Object.entries(current)) {
      updated[roleId] = roleItems.filter((item) => item.id !== itemId);
    }

    saveItems(updated);
    set({ items: updated });
  },

  clearRoleItems: (roleId: string) => {
    const current = get().items;
    const updated = { ...current };
    delete updated[roleId];
    saveItems(updated);
    set({ items: updated });
  },

  getTotalDueCount: () => {
    const allItems = get().items;
    let count = 0;
    for (const roleItems of Object.values(allItems)) {
      count += filterDueItems(roleItems).length;
    }
    return count;
  },
}));

export default useSpacedRepetitionStore;
