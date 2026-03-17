import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { AccountSecurityService } from '../account-security.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private accountSecurityService: AccountSecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ipAddress = this.getClientIpAddress(request);

    // Check if IP is blocked
    const isBlocked = await this.accountSecurityService.shouldBlockIpAddress(ipAddress);
    if (isBlocked) {
      throw new HttpException(
        'Too many login attempts from this IP address. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
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
