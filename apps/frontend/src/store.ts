import { create } from 'zustand';
import type { MrgRecord } from './types';
import { fetchMrg } from './api';

type State = {
    loading: boolean;
    items: MrgRecord[];
    total: number;
    page: number;
    limit: number;
    search: string;
    minLoad?: number;
    maxLoad?: number;
    error?: string;
    setFilters: (f: Partial<Pick<State, 'search' | 'minLoad' | 'maxLoad'>>) => void;
    setItems: (items: MrgRecord[]) => void;
    loadPage: (page?: number) => Promise<void>;
    refresh: () => Promise<void>;
};

export const useStore = create<State>((set, get) => ({
    loading: false,
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    search: '',
    setFilters: (f) => set(f),
    setItems: (items) => set({ items }),
    loadPage: async (pageParam) => {
        const { limit, search, minLoad, maxLoad } = get();
        const page = pageParam ?? get().page;
        set({ loading: true, error: undefined });
        try {
            const res = await fetchMrg({ page, limit, search, minLoad, maxLoad });
            set({ items: res.items, total: res.total, page, loading: false });
        } catch (e: any) {
            set({ loading: false, error: e?.message ?? 'Ошибка загрузки' });
        }
    },
    refresh: async () => get().loadPage(1),
}));
