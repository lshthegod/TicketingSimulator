import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

export async function ensureDatabaseExists(config: ConfigService) {
  const host = config.get<string>('DB_HOST', 'localhost');
  const port = config.get<number>('DB_PORT', 3306);
  const user = config.get<string>('DB_USER', 'root');
  const pass = config.get<string>('DB_PASS', '0000');
  const dbName = config.get<string>('DB_NAME', 'ticketing');

  // DB 이름 없이 MySQL 서버에만 접속
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password: pass,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );

  console.log(`✅ Database checked/created: ${dbName}`);

  await connection.end();
}
