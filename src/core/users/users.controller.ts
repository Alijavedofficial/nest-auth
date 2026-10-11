import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from '../../utils/auth/auth.service';
import { Token } from '../../utils/auth/entities/token.entity';
import { CredentialsDto, CryptoTokenDTO, FetchUserDto } from './dto/user.dto';
import { UsersService } from './users.service';
import { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body() { email, password }: CredentialsDto,
  ): Promise<FetchUserDto> {
    // Create User

    const hashedPassword = await this.authService.bcryptHash(password);
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
    });

    // Generate Token

    const token = this.authService.cryptoGenerateToken();
    const hashedToken = this.authService.cryptoHashToken(token);
    await this.authService.createToken({
      id: user.id,
      verifyToken: hashedToken,
    });

    // Send Email(Will be implemented later)

    return new FetchUserDto(user);
  }

  @Patch('verify/:token')
  @HttpCode(HttpStatus.OK)
  async verifyUser(
    @Param() { token }: CryptoTokenDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<FetchUserDto> {
    // Verify User

    const hashedToken: string = this.authService.cryptoHashToken(token);
    const { id }: Token = await this.authService.findToken({
      verifyToken: hashedToken,
    });
    await this.authService.updateToken(id, {
      verified: true,
      verifyToken: null,
    });

    // Find User
    const user = await this.usersService.find({ id });

    // Send WElCOME Email(Will be implemented later)

    // Set Cookie

    const { jwt, options } = await this.authService.createCookie({
      sub: id,
      verified: true,
    });
    res.cookie('user', jwt, options);

    return new FetchUserDto(user);
  }

  // @Post('login')
  // @HttpCode(HttpStatus.OK)
  // async loginUser() {}

  // @Get('logout')
  // @HttpCode(HttpStatus.OK)
  // async logoutUser() {}
}
