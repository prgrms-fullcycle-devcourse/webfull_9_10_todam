import { createApiEnv } from '@todam/config'
const env = createApiEnv()  // env.DATABASE_URL 타입 자동 추론

async function bootstrap() {
  // NestJS bootstrap will be wired after dependencies are installed.
}

void bootstrap();

