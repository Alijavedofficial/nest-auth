import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CookieOptions, Response } from 'express';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Token } from './entities/token.entity';
import {
  createCookieParams,
  createTokenParams,
  JwtCookie,
  updateTokenParams,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly JwtService: JwtService,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  private readonly hashAlgorithm: string = 'sha256';
  private readonly salt: number = 10;
  private readonly tokenEncoding: string = 'hex';

  private readonly jwtSecret: string | undefined =
    this.configService.get<string>('JWT_SECRET');
  private readonly jwtDomain: string | undefined =
    this.configService.get<string>('JWT_DOMAIN');
  private readonly jwtExpiresInDays: number = Number(
    this.configService.get('JWT_EXPIRES_IN'),
  );
  private readonly jwtExpiresInMilliseconds: number =
    Number(this.jwtExpiresInDays) * 24 * 60 * 60 * 1000;

  cryptoGenerateToken(): string {
    return crypto
      .randomBytes(32)
      .toString(this.tokenEncoding as BufferEncoding);
  }

  cryptoHashToken(token: string): string {
    return crypto
      .createHash(this.hashAlgorithm)
      .update(token)
      .digest(this.tokenEncoding as crypto.BinaryToTextEncoding);
  }

  async bcryptHash(value: string): Promise<string> {
    try {
      return await bcrypt.hash(value, this.salt);
    } catch (error) {
      this.logger.error(error);

      throw new InternalServerErrorException(`Error hashing value: ${value}`);
    }
  }

  async bcryptCompare(value: string, encryptedValue: string): Promise<boolean> {
    try {
      return await bcrypt.compare(value, encryptedValue);
    } catch (error) {
      this.logger.error(error);

      throw new InternalServerErrorException(
        `Error comparing values: ${value} and ${encryptedValue}`,
      );
    }
  }

  async findToken(params: FindOptionsWhere<Token>): Promise<Token> {
    const token = await this.tokenRepository.findOneBy(params);
    if (!token) {
      throw new BadRequestException(
        'Credentials are invalid or token has expired',
      );
    }
    return token;
  }

  async createToken(params: createTokenParams): Promise<void> {
    try {
      await this.tokenRepository.save(params);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error creating token');
    }
  }

  async updateToken(id: string, params: updateTokenParams): Promise<void> {
    try {
      await this.tokenRepository.update({ id }, params);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error updating token');
    }
  }

  async createCookie(params: createCookieParams): Promise<JwtCookie> {
    const options: CookieOptions = this.setCookieOptions();

    try {
      const jwt: string = await this.JwtService.signAsync(
        { ...params },
        { secret: this.jwtSecret, expiresIn: `${this.jwtExpiresInDays}d` },
      );
      return { jwt, options };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error creating cookie');
    }
  }

  clearCookies(res: Response, cookies: string[]): void {
    cookies.forEach((cookie: string): void => {
      res.clearCookie(cookie, { domain: this.jwtDomain });
    });
  }
  private setCookieOptions(): CookieOptions {
    const expires = new Date(Date.now() + this.jwtExpiresInMilliseconds);
    return { httpOnly: true, expires, domain: this.jwtDomain, secure: true };
  }
}
