import {
  BadRequestException,
  Body,
  ConflictException,
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
import { Response } from 'express';
import { AuthService } from '../../utils/auth/auth.service';
import { ClassicResponseDTO } from '../../utils/auth/dto/util.dto';
import { Token } from '../../utils/auth/entities/token.entity';
import {
  CredentialsDTO,
  CryptoTokenDTO,
  FetchUserDTO,
  ForgotPasswordDTO,
  ResendEmailDTO,
  ResetPasswordDTO,
} from './dto/user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body() { email, password }: CredentialsDTO,
  ): Promise<FetchUserDTO> {
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
    return new FetchUserDTO(user);
  }

  @Patch('verify/:token')
  @HttpCode(HttpStatus.OK)
  async verifyUser(
    @Param() { token }: CryptoTokenDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<FetchUserDTO> {
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
    return new FetchUserDTO(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() { email, password }: CredentialsDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<FetchUserDTO> {
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
    return new FetchUserDTO(user);
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

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() { email }: ForgotPasswordDTO,
  ): Promise<ClassicResponseDTO> {
    // Find User
    const { id }: User = await this.usersService.find({ email });

    // Check if User is verified
    const token: Token = await this.authService.findToken({ id });
    if (!token.verified) {
      throw new ConflictException('User is not verified');
    }

    // Generate Token
    const cryptoToken: string = this.authService.cryptoGenerateToken();
    const hashedToken: string = this.authService.cryptoHashToken(cryptoToken);
    await this.authService.createToken({ id, passwordToken: hashedToken });

    // Send Email(Will be implemented later)

    // Return Response
    return new ClassicResponseDTO({
      message: 'Password reset email sent successfully',
      statusCode: HttpStatus.OK,
    });
  }

  @Patch('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param() { token }: CryptoTokenDTO,
    @Body() { password }: ResetPasswordDTO,
  ): Promise<FetchUserDTO> {
    // Find and Verify Token
    const hashedToken: string = this.authService.cryptoHashToken(token);
    const { id }: Token = await this.authService.findToken({
      passwordToken: hashedToken,
    });

    // Find User
    const user: User = await this.usersService.find({ id });

    // Check password is not the same as the old password
    const isSamePassword: boolean = await this.authService.bcryptCompare(
      password,
      user?.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as old password',
      );
    }

    // Update Password
    const hashedPassword: string = await this.authService.bcryptHash(password);
    await this.authService.updateToken(id, { passwordToken: null });
    await this.usersService.update(user, { password: hashedPassword });

    // Return User
    return new FetchUserDTO(user);
  }

  @Post('resend-email')
  @HttpCode(HttpStatus.OK)
  async resendEmail(
    @Body() { email, template }: ResendEmailDTO,
  ): Promise<ClassicResponseDTO> {}
}
