import 'dotenv/config';
import { createApiEnv } from '@todam/config';

async function bootstrap(): Promise<void> {
    const env = createApiEnv();
    console.warn('PORT:', env.PORT);
}

void bootstrap();
