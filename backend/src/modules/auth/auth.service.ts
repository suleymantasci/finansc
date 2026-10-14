import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID, createHash } from 'crypto';
import { User, UserRole } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { isExposedAdminPassword } from '../../common/public-passwords';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.save(users.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        passwordHash,
      }));
      return this.generateTokens(user, undefined, undefined, manager);
    });
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOne({
        where: { email: dto.email.toLowerCase() },
        select: ['id', 'email', 'passwordHash', 'role', 'isActive', 'tokenVersion', 'firstName', 'lastName', 'phone', 'city', 'birthDate', 'gender'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
        throw new UnauthorizedException('E-posta veya şifre hatalı');
      }
      if (!user.isActive) throw new UnauthorizedException('Hesap devre dışı bırakılmış');
      if (user.role === UserRole.ADMIN && isExposedAdminPassword(dto.password)) {
        throw new UnauthorizedException('Yönetici şifresi yenilenmeli; şifre sıfırlama bağlantısı isteyin');
      }
      return this.generateTokens(user, userAgent, ipAddress, manager);
    });
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = await this.hashToken(refreshToken);
    const candidate = await this.refreshRepo.findOne({ where: { tokenHash, isRevoked: false } });
    if (!candidate) throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    return this.dataSource.transaction(async (manager) => {
      // Every session mutation locks the user first, then consumes its token.
      const user = await manager.getRepository(User).findOne({
        where: { id: candidate.userId }, lock: { mode: 'pessimistic_write' },
      });
      if (!user?.isActive) throw new UnauthorizedException('Hesap devre dışı bırakılmış');
      const tokens = manager.getRepository(RefreshToken);
      const consumed = await tokens.update(
        { id: candidate.id, tokenHash, isRevoked: false, expiresAt: MoreThan(new Date()) },
        { isRevoked: true },
      );
      if (consumed.affected !== 1) throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
      return this.generateTokens(user, candidate.userAgent ?? undefined, candidate.ipAddress ?? undefined, manager);
    });
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
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.findOne({
        where: { id: userId },
        select: ['id', 'email', 'passwordHash', 'role', 'isActive', 'tokenVersion', 'firstName', 'lastName'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user?.isActive) throw new UnauthorizedException();
      if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) throw new BadRequestException('Mevcut şifre hatalı');
      if (user.role === UserRole.ADMIN && isExposedAdminPassword(dto.newPassword)) throw new BadRequestException('Bu şifre kullanılamaz');
      user.passwordHash = passwordHash;
      user.tokenVersion += 1;
      await users.save(user);
      await manager.getRepository(RefreshToken).update({ userId, isRevoked: false }, { isRevoked: true });
      return { ...(await this.generateTokens(user, undefined, undefined, manager)), message: 'Şifre başarıyla değiştirildi' };
    });
  }

  async logout(userId: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(User).increment({ id: userId }, 'tokenVersion', 1);
      await manager.getRepository(RefreshToken).update({ userId, isRevoked: false }, { isRevoked: true });
    });
    return { ok: true };
  }

  async profile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.isActive) throw new UnauthorizedException();
    return this.publicUser(user);
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
    manager: EntityManager = this.dataSource.manager,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.tokenVersion,
    };

    const accessToken = this.jwtService.sign(
      payload,
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m') as any,
      },
    );

    const refreshTokenValue = randomUUID();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.parseDays(refreshExpiresIn));

    const tokens = manager.getRepository(RefreshToken);
    const tokenRecord = tokens.create({
      tokenHash: await this.hashToken(refreshTokenValue),
      expiresAt,
      userId: user.id,
      userAgent: userAgent?.substring(0, 255),
      ipAddress: ipAddress?.substring(0, 45),
    });
    await tokens.save(tokenRecord);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: this.publicUser(user),
    };
  }

  private async hashToken(token: string): Promise<string> {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicUser(user: User) {
    const { id, email, firstName, lastName, role, isActive, phone, city, birthDate, gender } = user;
    return { id, email, firstName, lastName, role, isActive, phone, city, birthDate, gender };
  }
  private parseDays(value: string): number {
    const match = value.match(/^(\d+)d$/);
    return match ? parseInt(match[1], 10) : 7;
  }
}
