import {
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { UserService } from "../services/user.service";

@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Post(":uid/init")
  async initUser(@Param("uid") uid: string): Promise<object> {
    const newUser = await this.userService.init(uid);

    if (!newUser) {
      throw new HttpException(
        {
          message: "user with provided uid is already exist.",
        },
        HttpStatus.CONFLICT
      );
    }

    return { message: "ok" };
  }
}
