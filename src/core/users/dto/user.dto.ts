import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  emailRegExp,
  passwordRegExp,
} from '../../../utils/validators/validator';

export class FetchUserDto {
  constructor(partial: Partial<FetchUserDto>) {
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

export class CredentialsDto {
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
