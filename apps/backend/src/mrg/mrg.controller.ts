import {
    BadRequestException,
    Controller,
    Get,
    Logger,
    Param,
    Post,
    Delete,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MrgService } from './mrg.service';
import { ListQueryDto } from './dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('mrg')
@Controller('api')
export class MrgController {
    private readonly logger = new Logger(MrgController.name);
    constructor(private readonly service: MrgService) {}

    @Post('upload')
    @ApiOperation({ summary: 'Загрузить Excel (.xlsx)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: (req, file, cb) => {
            if (!/\.xlsx$/i.test(file.originalname)) {
                return cb(new BadRequestException('Только .xlsx'), false);
            }
            cb(null, true);
        },
    }))
    async upload(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('Файл не получен');
        try {
            const records = this.service.parseExcel(file.buffer);
            await this.service.appendRecords(records);
            return { added: records.length };
        } catch (e) {
            this.logger.error('Ошибка парсинга', e as any);
            throw new BadRequestException('Ошибка парсинга Excel');
        }
    }

    @Get('mrg')
    async list(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('search') search?: string,
        @Query('minLoad') minLoad?: number,
        @Query('maxLoad') maxLoad?: number,
        @Query('sortBy') sortBy?: 'pipeline' | 'mg' | 'km' | 'dateISO' | 'loadLevel' | 'avgDailyConsumption' | 'tvps',
        @Query('sortOrder') sortOrder?: 'asc' | 'desc'
    ) {
        return this.service.list({ page, limit, search, minLoad, maxLoad, sortBy, sortOrder });
    }

    @Get('mrg/timeseries/:pipeline')
    @ApiOperation({ summary: 'Таймсерия по МРГ (для графика)' })
    async ts(@Param('pipeline') pipeline: string) {
        if (!pipeline) throw new BadRequestException('pipeline is required');
        return this.service.timeSeriesByPipeline(pipeline);
    }
    @Delete('clear')
    @ApiOperation({ summary: 'Очистить все данные' })
    async clear() {
        await this.service.clearDb();
        return { message: 'База данных очищена' };
    }
}
