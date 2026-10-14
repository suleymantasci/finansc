import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators';
import { ACCESS_COOKIE, readCookie } from '../../../common/session';

const PUBLIC_FLAG = Symbol('publicRoute');

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPublic) return super.canActivate(context) as Promise<boolean>;

    // Herkese açık rota: token varsa kullanıcıyı çöz (ör. admin taslakları görebilsin),
    // yoksa ya da geçersizse ziyaretçi olarak devam et — asla reddetme.
    const req = context.switchToHttp().getRequest();
    req[PUBLIC_FLAG] = true;
    if (!req.headers?.authorization && !readCookie(req.headers?.cookie, ACCESS_COOKIE)) return true;
    try {
      await super.canActivate(context);
    } catch {
      /* ziyaretçi */
    }
    return true;
  }

  override handleRequest<T>(err: Error | null, user: T, _info: unknown, context: ExecutionContext): T {
    const req = context?.switchToHttp().getRequest();
    if (req?.[PUBLIC_FLAG]) return (user || null) as T;
    if (err || !user) {
      throw err || new UnauthorizedException('Oturum süresi dolmuş veya geçersiz token');
    }
    return user;
  }
}
