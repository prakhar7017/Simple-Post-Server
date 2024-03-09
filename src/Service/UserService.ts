import { User } from "@/schemas";
import { IUser } from "@/schemas/UserSchema";

interface ICreateUser {
    email: string;
    username: string;
    password: string;
    firstname?: string;
    lastname?: string;
    date?: string | Date;
    
}

export default class UserService {
  public static async createUser(payload:ICreateUser) {
    try {
      const user = new User({
        email: payload.email,
        username : payload.username,
        password : payload.password,
        firstname : payload.firstname,
        lastname : payload.lastname,
        dateJoined: new Date()
      });
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  }

  public static async findUserByEmail(email: string) {
    try {
      return await User.findOne({
        email
      });
    } catch (error) {
      throw error;
    }
  }

  public static async findUserById(id:number) {
    try {
      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  }

}