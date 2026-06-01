import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      passwordHash,
    });
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      select: ['id', 'email', 'passwordHash', 'role', 'isActive', 'firstName', 'lastName', 'phone', 'city', 'birthDate', 'gender'],
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hesap devre dışı bırakılmış');
    }

    return this.generateTokens(user, userAgent, ipAddress);
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.refreshRepo.findOne({
      where: { tokenHash: await this.hashToken(refreshToken), isRevoked: false },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    }

    // Revoke old token
    tokenRecord.isRevoked = true;
    await this.refreshRepo.save(tokenRecord);

    return this.generateTokens(tokenRecord.user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.userRepo.update(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      city: dto.city ?? null,
      birthDate: dto.birthDate ?? null,
      gender: dto.gender ?? null,
    });
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      city: user.city,
      birthDate: user.birthDate,
      gender: user.gender,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Mevcut şifre hatalı');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);
    return { message: 'Şifre başarıyla değiştirildi' };
  }

  async logout(userId: string) {
    await this.refreshRepo.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  async cleanupExpiredTokens() {
    await this.refreshRepo.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private async generateTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(
      { sub: payload.sub, email: payload.email, role: payload.role },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m') as any,
      },
    );

    const refreshTokenValue = randomUUID();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.parseDays(refreshExpiresIn));

    const tokenRecord = this.refreshRepo.create({
      tokenHash: await this.hashToken(refreshTokenValue),
      expiresAt,
      userId: user.id,
      userAgent: userAgent?.substring(0, 255),
      ipAddress: ipAddress?.substring(0, 45),
    });
    await this.refreshRepo.save(tokenRecord);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  private async hashToken(token: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDays(value: string): number {
    const match = value.match(/^(\d+)d$/);
    return match ? parseInt(match[1], 10) : 7;
  }
}
