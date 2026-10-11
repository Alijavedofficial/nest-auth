import { PickType } from '@nestjs/mapped-types';
import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  emailRegExp,
  passwordRegExp,
} from '../../../utils/validators/validator';

export class FetchUserDTO {
  constructor(partial: Partial<FetchUserDTO>) {
    Object.assign(this, partial);
  }

  id: string;
  email: string;

  @Exclude()
  password: string;

  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  deletedAt: Date | null;
}

export class CredentialsDTO {
  @IsString()
  @IsNotEmpty()
  @Matches(emailRegExp.pattern, emailRegExp.validationOptions)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(passwordRegExp.pattern, passwordRegExp.validationOptions)
  password: string;
}

export class CryptoTokenDTO {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ForgotPasswordDTO extends PickType(CredentialsDTO, [
  'email',
] as const) {}

export class ResetPasswordDTO extends PickType(CredentialsDTO, [
  'password',
] as const) {}
