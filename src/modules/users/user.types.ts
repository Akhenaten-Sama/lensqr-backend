export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password_hash: string;
  token: string | null;
  is_blacklisted: boolean;
  created_at: Date;
  updated_at: Date;
}

export type PublicUser = Omit<User, 'password_hash' | 'token' | 'is_blacklisted'>;

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password_hash: string;
  token: string;
  is_blacklisted: boolean;
}
