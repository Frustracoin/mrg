import { useEffect, useState } from 'react';
import { UploadButton } from './components/UploadButton';
import { useStore } from './store';
import { Table } from './components/Table';
import { ChartModal } from './components/ChartModal';

export default function App() {
    const { loadPage, page, total, limit, setFilters, search, minLoad, maxLoad } = useStore();
    const [pipeline, setPipeline] = useState<string | undefined>();

    useEffect(() => { loadPage(1); }, []);

    const pages = Math.ceil(total / limit) || 1;

    return (
        <div className="container">
            <header className="header">
                <h1>Загрузка данных МРГ</h1>
                <UploadButton />
            </header>

            <section className="filters">
                <input
                    placeholder="Поиск по МРГ/МГ"
                    value={search}
                    onChange={e => setFilters({ search: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && loadPage(1)}
                />
                <input
                    type="number"
                    placeholder="Мин. уровень загрузки"
                    value={minLoad ?? ''}
                    onChange={e => setFilters({ minLoad: e.target.value ? Number(e.target.value) : undefined })}
                />
                <input
                    type="number"
                    placeholder="Макс. уровень загрузки"
                    value={maxLoad ?? ''}
                    onChange={e => setFilters({ maxLoad: e.target.value ? Number(e.target.value) : undefined })}
                />
                <button onClick={() => loadPage(1)}>Применить</button>
            </section>

            <Table onGraph={(p) => setPipeline(p)} />

            <footer className="pager">
                <button onClick={() => loadPage(page - 1)} disabled={page <= 1}>←</button>
                <span>{page} / {pages}</span>
                <button onClick={() => loadPage(page + 1)} disabled={page >= pages}>→</button>
            </footer>

            <ChartModal pipeline={pipeline} onClose={() => setPipeline(undefined)} />
        </div>
    );
}
