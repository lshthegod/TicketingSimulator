import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ensureDatabaseExists } from './database.utils';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (
        config: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        await ensureDatabaseExists(config);
        return {
          type: 'mysql',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          username: config.get('DB_USER'),
          password: config.get('DB_PASS'),
          database: config.get('DB_NAME'),
          autoLoadEntities: true,
        };
      },
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class DatabaseModule {}
