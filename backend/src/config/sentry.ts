// Sentry Configuration - TypeScript Version
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  beforeSend(event, hint) {
    // Hassas bilgileri filtrele
    if (event.request) {
      const request = event.request;

      // Headers'da hassas verileri temizle
      if (request.headers) {
        delete request.headers.cookie;
        delete request.headers.authorization;
      }

      // Query params'de şifre varsa temizle
      if (request.query) {
        const query = { ...request.query };
        ['password', 'token', 'secret', 'apiKey', 'api_key'].forEach(key => {
          delete query[key];
        });
        event.request.query = query;
      }
    }

    // Kullanıcı bilgilerini maskele (TC Kimlik No vb.)
    if (event.user && event.user.tc_no) {
      event.user.tc_no = '***';
    }

    return event;
  },

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Prisma(),
  ],

  // Performance monitoring
  beforeSendTransaction(event) {
    // Health check isteklerini izleme
    if (event.transaction === '/health') {
      return null;
    }
    return event;
  },
});

export default Sentry;
