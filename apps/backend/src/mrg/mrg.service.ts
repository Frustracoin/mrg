import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs-extra';
import { v4 as uuid } from 'uuid';
import { MrgRecord } from './types';

const MONTHS_RU = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
];

function monthLabel(date: Date): string {
    return `${MONTHS_RU[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function normalizePeriodToISO(v: any): { iso: string; label: string } {
    if (v instanceof Date) {
        const iso = `${v.getUTCFullYear()}-${String(v.getUTCMonth()+1).padStart(2,'0')}-01`;
        return { iso, label: monthLabel(v) };
    }
    
    if (typeof v === 'number' && v > 1000) {
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (v - 2) * 24 * 60 * 60 * 1000);
        const iso = `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-01`;
        return { iso, label: monthLabel(date) };
    }
    
    const s = String(v).trim().toLowerCase().replace(/\s+/g,' ');
    
    const m1 = s.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})$/);
    if (m1) {
        const [, dd, mm, yy] = m1;
        const iso = `${yy}-${String(Number(mm)).padStart(2,'0')}-${String(Number(dd)).padStart(2,'0')}`;
        return { iso, label: monthLabel(new Date(iso)) };
    }
    
    const monthIndex = MONTHS_RU.findIndex(m => s.startsWith(m));
    if (monthIndex >= 0) {
        const yearMatch = s.match(/(\d{4})/);
        const yy = yearMatch ? yearMatch[1] : new Date().getFullYear();
        const iso = `${yy}-${String(monthIndex+1).padStart(2,'0')}-01`;
        return { iso, label: monthLabel(new Date(iso)) };
    }
    
    const now = new Date();
    return { iso: `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-01`, label: monthLabel(now) };
}

@Injectable()
export class MrgService {
    private readonly logger = new Logger(MrgService.name);
    private readonly dbPath = 'data/db.json';

    async readDb(): Promise<MrgRecord[]> {
        try {
            await fs.ensureFile(this.dbPath);
            const content = await fs.readFile(this.dbPath, 'utf-8');
            return content.trim() ? JSON.parse(content) : [];
        } catch (e) {
            this.logger.error('Ошибка чтения БД', e as any);
            return [];
        }
    }

    private async writeDb(data: MrgRecord[]): Promise<void> {
        await fs.ensureDir('data');
        await fs.writeJson(this.dbPath, data, { spaces: 2 });
    }

    parseExcel(buffer: Buffer): MrgRecord[] {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const normalizeHeader = (v: any) => String(v ?? '')
            .toLowerCase()
            .replace(/\([^)]*\)/g, '')
            .replace(/[^a-zа-я0-9]+/gi, '')
            .trim();

        const headerMatchers: Record<string, ((s: string) => boolean)[]> = {
            pipeline: [
                s => s.includes('магистральныйраспределительныйгазопровод'),
                s => s.includes('газопровод'),
            ],
            mg: [
                s => s.includes('точкаподключения'),
                s => s.includes('мг'),
            ],
            period: [
                s => s.includes('период'),
            ],
            loadLevel: [
                s => s.includes('уровеньзагрузки'),
            ],
            avg: [
                s => s.includes('фак') && s.includes('среднесут') && s.includes('расход'),
            ],
            tvps: [
                s => s.includes('твпс'),
            ],
            km: [
                s => s === 'км' || s.endsWith('км'),
            ],
        };

        let headerRowIndex = -1;
        let columnIndexByKey: Partial<Record<'pipeline'|'mg'|'period'|'loadLevel'|'avg'|'tvps'|'km', number>> = {};

        const tryMapHeader = (row: any[], rowIndex: number) => {
            const map: typeof columnIndexByKey = {};
            row.forEach((cell, idx) => {
                const h = normalizeHeader(cell);
                if (!h) return;
                (Object.keys(headerMatchers) as Array<keyof typeof headerMatchers>).forEach(k => {
                    if (map[k] != null) return;
                    if (headerMatchers[k].some(fn => fn(h))) map[k] = idx;
                });
            });
            const required: Array<keyof typeof map> = ['pipeline','mg','period','loadLevel','avg','tvps'];
            const ok = required.every(k => map[k] != null);
            if (ok) {
                headerRowIndex = rowIndex;
                columnIndexByKey = map;
            }
        };

        for (let i = 0; i < Math.min(5, rows.length) && headerRowIndex === -1; i++) {
            tryMapHeader(rows[i] || [], i);
        }

        if (headerRowIndex === -1) {
            throw new Error('Неверный формат Excel: не найдены обязательные заголовки');
        }

        const isHeaderLike = (row: any[]): boolean => {
            const normalized = (row || []).map(normalizeHeader).filter(Boolean);
            if (normalized.length === 0) return false;
            let matches = 0;
            (Object.keys(headerMatchers) as Array<keyof typeof headerMatchers>).forEach(k => {
                if (normalized.some(h => headerMatchers[k].some(fn => fn(h)))) matches++;
            });
            return matches >= 2;
        };

        const dataRows = rows
            .slice(headerRowIndex + 1)
            .filter(r => (r ?? []).some(c => String(c ?? '').trim() !== ''))
            .filter(r => !isHeaderLike(r));

        const mapped: MrgRecord[] = dataRows.map((row: any[]) => {
            const pipeline = String(row[columnIndexByKey.pipeline!] ?? '').trim();
            const mg = String(row[columnIndexByKey.mg!] ?? '').trim();
            const kmRaw = columnIndexByKey.km != null ? row[columnIndexByKey.km] : 0;
            const period = row[columnIndexByKey.period!];
            const loadLevelRaw = row[columnIndexByKey.loadLevel!];
            const avgRaw = row[columnIndexByKey.avg!];
            const tvpsRaw = row[columnIndexByKey.tvps!];

            if (!pipeline && !mg) return null as any;

            const km = kmRaw === '-' ? 0 : Number(String(kmRaw ?? 0).replace(',', '.')) || 0;
            const { iso, label } = normalizePeriodToISO(period);
            const loadLevel = Math.max(0, Math.min(100, Number(String(loadLevelRaw).replace(',', '.')) || 0));
            const avg = Number(String(avgRaw).replace(',', '.')) || 0;
            const tvps = Number(String(tvpsRaw).replace(',', '.')) || 0;

            return {
                id: uuid(),
                pipeline,
                mg,
                km,
                dateISO: iso,
                dateLabel: label,
                loadLevel,
                avgDailyConsumption: avg,
                tvps,
            };
        }).filter(Boolean);

        return mapped;
    }

    async appendRecords(records: MrgRecord[]): Promise<void> {
        const existing = await this.readDb();
        const updated = [...existing, ...records];
        await this.writeDb(updated);
    }

    async list(params: {
        search?: string;
        minLoad?: number;
        maxLoad?: number;
        page: number;
        limit: number;
        sortBy?: 'pipeline' | 'mg' | 'km' | 'dateISO' | 'loadLevel' | 'avgDailyConsumption' | 'tvps';
        sortOrder?: 'asc' | 'desc';
    }) {
        const { search, minLoad, maxLoad, page, limit, sortBy = 'dateISO', sortOrder = 'desc' } = params;
        let data = await this.readDb();

        if (search) {
            const q = search.toLowerCase();
            data = data.filter(d =>
                d.pipeline.toLowerCase().includes(q) ||
                d.mg.toLowerCase().includes(q)
            );
        }
        if (minLoad != null) data = data.filter(d => d.loadLevel >= minLoad);
        if (maxLoad != null) data = data.filter(d => d.loadLevel <= maxLoad);
        
        data.sort((a, b) => {
            let aVal: any = a[sortBy];
            let bVal: any = b[sortBy];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        
        const total = data.length;
        const start = (page - 1) * limit;
        const items = data.slice(start, start + limit);
        return { total, items };
    }

    async timeSeriesByPipeline(pipeline: string) {
        const data = await this.readDb();
        const filtered = data.filter(d => d.pipeline === pipeline);
        
        const result: Array<{
            date: string;
            avgDailyConsumption: number;
            tvps: number;
            mg: string;
            km: number;
            loadLevel: number;
        }> = [];
        
        filtered.forEach((record, index) => {
            result.push({
                date: `${record.mg} - ${record.dateLabel} (${index + 1})`,
                avgDailyConsumption: record.avgDailyConsumption,
                tvps: record.tvps,
                mg: record.mg,
                km: record.km,
                loadLevel: record.loadLevel,
            });
        });
        
        return result.sort((a, b) => a.date.localeCompare(b.date));
    }

    async clearDb(): Promise<void> {
        await this.writeDb([]);
        this.logger.log('База данных очищена');
    }
}
