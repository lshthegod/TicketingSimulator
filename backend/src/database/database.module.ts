import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ensureDatabaseExists } from './database.utils';

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
          synchronize: true,
          // logging: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
