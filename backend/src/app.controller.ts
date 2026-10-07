import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Verificar estado del servicio y conectividad con la base de datos' })
  @ApiResponse({ status: 200, description: 'Servicio y base de datos operativos' })
  @ApiResponse({ status: 503, description: 'Servicio degradado o sin conexión a base de datos' })
  getHealth() {
    return this.appService.getHealth();
  }
}
