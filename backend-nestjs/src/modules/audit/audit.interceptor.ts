import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditService: AuditService) {}

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const sensitiveFields = ['password', 'confirmPassword', 'currentPassword', 'newPassword', 'token', 'refreshToken', 'accessToken', 'secret'];
    const sanitized = { ...body };
    for (const field of sensitiveFields) {
      if (field in sanitized) sanitized[field] = '[REDACTED]';
    }
    return sanitized;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params, query } = request;

    // Extract user info
    const userId = user?.id || null;
    const username = user?.username || 'anonymous';

    // Determine action from method
    const action = this.determineAction(method, url);

    // Determine entity type from URL
    const entityType = this.determineEntityType(url);

    // Extract entity ID from params or body
    const entityId = this.extractEntityId(params, body);

    // Get IP address
    const ipAddress = this.getClientIpAddress(request);
    const userAgent = request.get('user-agent') || 'Unknown';

    // Only log data-modifying operations (POST, PUT, DELETE)
    const shouldLog = ['POST', 'PUT', 'DELETE'].includes(method);

    if (!shouldLog) {
      return next.handle();
    }

    this.logger.debug(
      `Audit: ${method} ${url} - User: ${username} - Action: ${action} - Entity: ${entityType}`,
    );

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.auditService.log(
            userId,
            action as AuditAction,
            entityType,
            entityId || undefined,
            { method, url, body: this.sanitizeBody(body), params, query },
            ipAddress,
            userAgent,
          );
          this.logger.debug(`Audit logged successfully for ${action} on ${entityType}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to log audit entry: ${errorMessage}`);
        }
      }),
      catchError(async (error: unknown) => {
        try {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.auditService.log(
            userId,
            action as AuditAction,
            entityType,
            entityId || undefined,
            { method, url, body: this.sanitizeBody(body), params, query, error: errorMessage, status: 'FAILED' },
            ipAddress,
            userAgent,
          );
          this.logger.debug(`Audit logged for failed ${action} on ${entityType}`);
        } catch (auditError: unknown) {
          const auditErrorMessage = auditError instanceof Error ? auditError.message : String(auditError);
          this.logger.error(`Failed to log audit entry for error: ${auditErrorMessage}`);
        }
        throw error;
      }),
    );
  }

  private determineAction(method: string, url: string): string {
    if (method === 'POST') {
      if (url.includes('/login')) return 'LOGIN';
      if (url.includes('/register')) return 'CREATE'; // User registration is a CREATE action
      if (url.includes('/password-reset')) return 'PASSWORD_RESET_REQUEST';
      if (url.includes('/verify-email')) return 'EMAIL_VERIFICATION_SEND';
      return 'CREATE';
    } else if (method === 'PUT') {
      return 'UPDATE';
    } else if (method === 'DELETE') {
      return 'DELETE';
    }
    return 'CREATE';
  }

  private determineEntityType(url: string): string {
    if (url.includes('/users')) return 'USER';
    if (url.includes('/hotels')) return 'HOTEL';
    if (url.includes('/tourisms')) return 'TOURISM';
    if (url.includes('/bookings')) return 'BOOKING';
    if (url.includes('/ratings')) return 'RATING';
    if (url.includes('/map-points')) return 'MAP_POINT';
    if (url.includes('/roads')) return 'ROAD';
    if (url.includes('/horse-services')) return 'HORSE_SERVICE';
    if (url.includes('/language-guiders')) return 'LANGUAGE_GUIDER';
    if (url.includes('/auth')) return 'AUTH';
    return 'UNKNOWN';
  }

  private extractEntityId(params: any, body: any): number | null {
    // Try to get ID from params
    if (params?.id) {
      const id = parseInt(params.id);
      if (!isNaN(id)) return id;
    }

    // Try to get ID from body
    if (body?.id) {
      const id = parseInt(body.id);
      if (!isNaN(id)) return id;
    }

    return null;
  }

  private getClientIpAddress(request: any): string {
    const xForwardedFor = request.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    const xRealIp = request.get('x-real-ip');
    if (xRealIp) {
      return xRealIp;
    }

    return request.ip || request.connection.remoteAddress || 'unknown';
  }
}
