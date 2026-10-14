import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ACCESS_COOKIE, readCookie } from '../../../common/session';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  ver: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, @InjectRepository(User) private readonly users: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => readCookie(req?.headers?.cookie, ACCESS_COOKIE) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user?.isActive || payload.ver !== user.tokenVersion) {
      throw new UnauthorizedException('Oturum geçersiz; yeniden giriş yapın');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
