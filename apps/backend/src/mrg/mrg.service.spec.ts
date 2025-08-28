import { Test, TestingModule } from '@nestjs/testing';
import { MrgService } from './mrg.service';
import { Logger } from '@nestjs/common';

jest.mock('fs-extra');
jest.mock('uuid');

describe('MrgService', () => {
  let service: MrgService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MrgService],
    }).compile();

    service = module.get<MrgService>(MrgService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clearDb', () => {
    it('should clear database', async () => {
      const mockLogger = jest.spyOn(Logger.prototype, 'log');
      
      await service.clearDb();
      
      expect(mockLogger).toHaveBeenCalledWith('База данных очищена');
    });
  });

  describe('list', () => {
    it('should return paginated results', async () => {
      jest.spyOn(service, 'readDb').mockResolvedValue([
        {
          id: '1',
          pipeline: 'Газовск',
          mg: 'МГ Трубовск',
          km: 0,
          dateISO: '2022-01-01',
          dateLabel: 'январь 2022',
          loadLevel: 46.34,
          avgDailyConsumption: 6.63,
          tvps: 14.31,
        }
      ]);

      const result = await service.list({ page: 1, limit: 10 });
      
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].pipeline).toBe('Газовск');
    });
  });

  describe('timeSeriesByPipeline', () => {
    it('should return time series data', async () => {
      jest.spyOn(service, 'readDb').mockResolvedValue([
        {
          id: '1',
          pipeline: 'Газовск',
          mg: 'МГ Трубовск',
          km: 0,
          dateISO: '2022-01-01',
          dateLabel: 'январь 2022',
          loadLevel: 46.34,
          avgDailyConsumption: 6.63,
          tvps: 14.31,
        }
      ]);

      const result = await service.timeSeriesByPipeline('Газовск');
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toContain('МГ Трубовск');
      expect(result[0].avgDailyConsumption).toBe(6.63);
      expect(result[0].tvps).toBe(14.31);
    });
  });
});