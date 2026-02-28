import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from './user.repository';
import { CreateUserDto, LoginDto, PublicUser, User } from './user.types';
import { AdjutorService } from '../../integrations/adjutor/adjutor.service';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../shared/errors/HttpError';
import { TokenHelper } from '../../shared/helpers/token.helper';

export interface WalletRepository {
  create(record: { id: string; user_id: string }, trx: Knex.Transaction): Promise<void>;
}

export interface CreateUserResult {
  user: PublicUser;
  wallet: { id: string; balance: string; currency: string };
  token: string;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
}

export class UserService {
  constructor(
    private readonly db: Knex,
    private readonly userRepo: UserRepository,
    private readonly walletRepo: WalletRepository,
    private readonly adjutorService: AdjutorService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<CreateUserResult> {
    // 1. Fast local check — avoid hitting Adjutor if the email is already taken
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists.');
    }

    // 2. External Karma blacklist check
    const isBlacklisted = await this.adjutorService.isBlacklisted(dto.email);
    if (isBlacklisted) {
      throw new ForbiddenError(
        'Account creation not allowed. This identity is on the Karma blacklist.',
        'USER_BLACKLISTED',
      );
    }

    // 3. Create user + wallet atomically
    return this.db.transaction(async (trx) => {
      const userId = uuidv4();
      const walletId = uuidv4();
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const token = TokenHelper.generate(userId);

      await this.userRepo.create(
        {
          id: userId,
          first_name: dto.first_name,
          last_name: dto.last_name,
          email: dto.email,
          phone_number: dto.phone_number,
          password_hash: passwordHash,
          token,
          is_blacklisted: false,
        },
        trx,
      );

      await this.walletRepo.create({ id: walletId, user_id: userId }, trx);

      const user = await this.userRepo.findById(userId, trx);
      return {
        user: this.toPublicUser(user!),
        wallet: { id: walletId, balance: '0.00', currency: 'NGN' },
        token,
      };
    });
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = TokenHelper.generate(user.id);
    await this.userRepo.updateToken(user.id, token);

    return { user: this.toPublicUser(user), token };
  }

  private toPublicUser(user: User): PublicUser {
    const { password_hash: _ph, token: _t, is_blacklisted: _ib, ...publicUser } = user;
    return publicUser;
  }
}
