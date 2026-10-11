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
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../utils/auth/auth.service';
import { Token } from '../../utils/auth/entities/token.entity';
import { CredentialsDto, CryptoTokenDTO, FetchUserDto } from './dto/user.dto';
import { UsersService } from './users.service';
import { Response } from 'express';
import { ClassicResponseDTO } from '../../utils/auth/dto/util.dto';

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

    // Return User
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

    // Return User
    return new FetchUserDto(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() { email, password }: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<FetchUserDto> {
    // Find User
    const user = await this.usersService.find({ email });

    const promises: Promise<Token | boolean>[] = [];

    promises.push(this.authService.findToken({ id: user.id }));
    promises.push(this.authService.bcryptCompare(password, user.password));

    const [{ verified }, match] = await Promise.all([
      promises?.[0] as Promise<Token>,
      promises?.[1] as Promise<boolean>,
    ]);

    if (!match) {
      throw new UnauthorizedException('Incorrect password');
    }

    if (!verified) {
      throw new UnauthorizedException('User is not verified');
    }

    // Set Cookie
    const { jwt, options } = await this.authService.createCookie({
      sub: user.id,
      verified,
    });
    res.cookie('user', jwt, options);

    //Return User
    return new FetchUserDto(user);
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async logoutUser(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ClassicResponseDTO> {
    // Clear Cookie
    this.authService.clearCookies(res, ['user']);

    // Return Response
    return new ClassicResponseDTO({
      message: 'User logged out successfully',
      statusCode: HttpStatus.OK,
    });
  }
}
