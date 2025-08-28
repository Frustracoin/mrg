import React, { useRef, useState } from 'react';
import { uploadExcel, clearDatabase } from '../api';
import { useStore } from '../store';

export const UploadButton: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [clearing, setClearing] = useState(false);
    const refresh = useStore(s => s.refresh);

    const onPick = () => inputRef.current?.click();

    const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setBusy(true);
            await uploadExcel(file);
            await refresh();
            e.target.value = '';
        } catch (err) {
            alert('Не удалось загрузить файл: ' + (err as any)?.message);
        } finally {
            setBusy(false);
        }
    };

    const onClear = async () => {
        if (!confirm('Точно очистить все данные? Это действие нельзя отменить.')) {
            return;
        }
        try {
            setClearing(true);
            await clearDatabase();
            await refresh();
            alert('База данных очищена!');
        } catch (err) {
            alert('Не удалось очистить базу: ' + (err as any)?.message);
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button onClick={onPick} disabled={busy} className="btn">
                {busy ? 'Загружаю...' : 'Загрузить данные'}
            </button>
            <button 
                onClick={onClear} 
                disabled={clearing} 
                className="btn btn-danger"
            >
                {clearing ? 'Очищаю...' : 'Очистить все'}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={onChange}
            />
        </div>
    );
};
