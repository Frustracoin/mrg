import React from 'react';

export const Progress: React.FC<{ value: number }> = ({ value }) => {
    const v = Math.max(0, Math.min(100, value));
    return (
        <div style={{ width: 120 }}>
            <div style={{ height: 10, background: '#e6e6e6', borderRadius: 6 }}>
                <div
                    style={{
                        height: 10,
                        width: `${v}%`,
                        borderRadius: 6,
                        background: v < 30 ? '#2e7d32' : v < 70 ? '#ef6c00' : '#c62828',
                        transition: 'width .2s',
                    }}
                />
            </div>
            <div style={{ fontSize: 12, textAlign: 'right', marginTop: 2 }}>{v.toFixed(2)}%</div>
        </div>
    );
};
