export interface CreateUserParams {
  email: string;
  password: string;
}

export interface UpdateUserParams extends Pick<CreateUserParams, 'password'> {}
