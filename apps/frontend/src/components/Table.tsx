import React, { useState } from 'react';
import { useStore } from '../store';
import { fetchMrg } from '../api';

interface SortConfig {
    field: 'pipeline' | 'mg' | 'km' | 'dateISO' | 'loadLevel' | 'avgDailyConsumption' | 'tvps';
    order: 'asc' | 'desc';
}

const LoadLevelBar: React.FC<{ value: number }> = ({ value }) => {
    const getColorClass = (level: number) => {
        if (level <= 20) return 'low';
        if (level <= 50) return 'medium';
        return 'high';
    };

    return (
        <div className="load-level-container">
            <div className="load-level-bar">
                <div 
                    className={`load-level-fill ${getColorClass(value)}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
            <span className="load-level-text">{value.toFixed(2)}%</span>
        </div>
    );
};

export const Table: React.FC<{ onGraph: (pipeline: string) => void }> = ({ onGraph }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'dateISO', order: 'desc' });
    const { items, loading, search, minLoad, maxLoad } = useStore();

    const handleSort = async (field: SortConfig['field']) => {
        const newOrder: 'asc' | 'desc' = sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc';
        const newSortConfig: SortConfig = { field, order: newOrder };
        
        setSortConfig(newSortConfig);
        
        try {
            const result = await fetchMrg({ 
                page: 1, 
                limit: 20, 
                sortBy: field, 
                sortOrder: newOrder,
                search,
                minLoad,
                maxLoad
            });
            
            useStore.getState().setItems(result.items);
            
        } catch (error) {
            console.error('Ошибка сортировки:', error);
        }
    };

    const getSortIcon = (field: SortConfig['field']) => {
        if (sortConfig.field !== field) return '';
        return sortConfig.order === 'asc' ? ' ↑' : ' ↓';
    };

    if (loading) return <div className="muted">Загрузка...</div>;
    if (!items.length) return <div className="muted">Нет данных</div>;

    return (
        <table className="table">
            <thead className="thead">
                <tr>
                    <th className="th" onClick={() => handleSort('pipeline')}>
                        МРГ{getSortIcon('pipeline')}
                    </th>
                    <th className="th" onClick={() => handleSort('mg')}>
                        МГ{getSortIcon('mg')}
                    </th>
                    <th className="th" onClick={() => handleSort('km')}>
                        Км{getSortIcon('km')}
                    </th>
                    <th className="th" onClick={() => handleSort('dateISO')}>
                        Период{getSortIcon('dateISO')}
                    </th>
                    <th className="th" onClick={() => handleSort('loadLevel')}>
                        Уровень загрузки{getSortIcon('loadLevel')}
                    </th>
                    <th
                        className="th"
                        style={{ width: 110, maxWidth: 110 }}
                        onClick={() => handleSort('avgDailyConsumption')}
                    >
                        Факт. среднесут. расход{getSortIcon('avgDailyConsumption')}
                    </th>
                    <th className="th" onClick={() => handleSort('tvps')}>
                        ТВПС{getSortIcon('tvps')}
                    </th>
                    <th className="th">График</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id}>
                        <td>{item.pipeline}</td>
                        <td>{item.mg}</td>
                        <td>{item.km}</td>
                        <td>{item.dateLabel}</td>
                        <td>
                            <LoadLevelBar value={item.loadLevel} />
                        </td>
                        <td style={{ width: 110, maxWidth: 110, textAlign: 'right' }}>
                            {item.avgDailyConsumption.toFixed(2)}
                        </td>
                        <td>{item.tvps.toFixed(2)}</td>
                        <td>
                            <button 
                                className="icon-btn" 
                                onClick={() => onGraph(item.pipeline)}
                                title="Показать график"
                            >
                                📊
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
