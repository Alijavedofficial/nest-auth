import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RequestWithCookie } from '../interfaces/auth.interface';

@Injectable()
export class JWTGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly JwtService: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request: RequestWithCookie = ctx.switchToHttp().getRequest();
    const { user } = request.cookies;

    try {
      request.user = await this.JwtService.verifyAsync(user, {
        secret: this.configService.get<string>('JWT_SECRET'),
        ignoreExpiration: false,
      });
    } catch (error) {
      throw new UnauthorizedException('Not authorized');
    }
    return true;
  }
}
