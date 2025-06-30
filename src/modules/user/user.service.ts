import UserModel from '../../database/models/user.model';

export class UserService {
  public async findUserById(userId: string) {
    const user = await UserModel.findById(userId, {
      password: false,
    });
    return user || null;
  }

  public async findUserByEmail(email: string) {
    const user = await UserModel.findOne(
      { email },
      {
        password: false,
      },
    );
    return user || null;
  }
}
