import { User } from '../../modules/users/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
