import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<{
    status: 'ok';
    database: 'connected';
    version?: string;
    timestamp: string;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        version: '1.0.1-fix-isolation',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        error: error?.message || 'Fallo de conectividad con la base de datos',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
