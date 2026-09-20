import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

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
}
