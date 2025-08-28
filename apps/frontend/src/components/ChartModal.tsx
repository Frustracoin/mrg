import React, { useEffect, useState } from 'react';
import { fetchTimeSeries } from '../api';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ChartModal: React.FC<{ pipeline?: string; onClose: () => void }> = ({ pipeline, onClose }) => {
    const [data, setData] = useState<any[]>([]);
    useEffect(() => {
        if (!pipeline) return;
        fetchTimeSeries(pipeline).then(setData).catch(e => alert(e.message));
    }, [pipeline]);

    if (!pipeline) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>Загрузка МРГ — {pipeline}</div>
                    <button onClick={onClose}>×</button>
                </div>
                <div style={{ height: 380 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="avgDailyConsumption"
                                name="Факт. среднесут. расход"
                                stroke="#1976d2"
                                dot={{ r: 3, stroke: '#1976d2' }}
                                activeDot={{ r: 5 }}
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="tvps"
                                name="ТВПС"
                                stroke="#2e7d32"
                                dot={{ r: 3, stroke: '#2e7d32' }}
                                activeDot={{ r: 5 }}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
