import axios from 'axios';
import type { MrgPage } from './types';

export const api = axios.create({
    baseURL: 'http://localhost:3001/api',
});

export async function uploadExcel(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post<{ added: number }>('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

export async function fetchMrg(params: {
    page?: number; 
    limit?: number; 
    search?: string; 
    minLoad?: number; 
    maxLoad?: number;
    sortBy?: 'pipeline' | 'mg' | 'km' | 'dateISO' | 'loadLevel' | 'avgDailyConsumption' | 'tvps';
    sortOrder?: 'asc' | 'desc';
}) {
    const { data } = await api.get<MrgPage>('/mrg', { params });
    return data;
}

export async function fetchTimeSeries(pipeline: string) {
    const { data } = await api.get<{ date: string; avgDailyConsumption: number; tvps: number }[]>(
        `/mrg/timeseries/${encodeURIComponent(pipeline)}`
    );
    return data;
}

export async function clearDatabase() {
    const { data } = await api.delete<{ message: string }>('/clear');
    return data;
}