import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '../../shared/helpers/response.helper';
import { CreateUserDto, LoginDto } from './user.types';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async register(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateUserDto;
    const result = await this.userService.createUser(dto);
    ApiResponse.created(res, result, 'Account created successfully.');
  }

  async login(req: Request, res: Response): Promise<void> {
    const dto = req.body as LoginDto;
    const result = await this.userService.login(dto);
    ApiResponse.success(res, result, 'Login successful.');
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    const { password_hash: _ph, token: _t, is_blacklisted: _ib, ...profile } = req.user!;
    ApiResponse.success(res, { user: profile }, 'Profile retrieved successfully.');
  }
}
