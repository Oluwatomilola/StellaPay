import { MONITORING } from '../utils/constants.js';
import { handleError } from '../utils/errors.js';

class MonitoringService {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        source: 'window.error',
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason, {
        source: 'window.unhandledrejection',
      });
    });

    this.initialized = true;
  }

  captureException(error, context = {}) {
    const normalizedError = handleError(error);

    console.error('StellaPay monitoring', normalizedError, context);

    if (typeof window !== 'undefined' && window.Sentry?.captureException) {
      window.Sentry.captureException(error instanceof Error ? error : new Error(normalizedError.message), {
        tags: {
          app: 'stellapay',
          environment: MONITORING.environment,
        },
        extra: {
          ...context,
          code: normalizedError.code,
        },
      });
    }

    if (MONITORING.errorWebhookUrl && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const payload = JSON.stringify({
        message: normalizedError.message,
        code: normalizedError.code,
        context,
        environment: MONITORING.environment,
        sentryConfigured: Boolean(MONITORING.sentryDsn),
        occurredAt: new Date().toISOString(),
      });

      navigator.sendBeacon(MONITORING.errorWebhookUrl, payload);
    }

    return normalizedError;
  }
}

export default new MonitoringService();
