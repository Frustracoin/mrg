export type MrgRecord = {
    id: string;
    pipeline: string;
    mg: string;
    km: number;
    dateISO: string;
    dateLabel: string;
    loadLevel: number;
    avgDailyConsumption: number;
    tvps: number;
};

export type MrgPage = {
    total: number;
    items: MrgRecord[];
};
