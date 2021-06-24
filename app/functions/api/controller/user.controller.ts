import {
  Controller,
  Post,
  Req,
  Param,
  UseGuards,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";

import { UserService } from "../services/user.service";
import {
  FirebaseAuthGuard,
  FirebaseAuthGuardRequest,
} from "../context/guards/firebase-auth.guard";

@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Post(":uid/init")
  @UseGuards(FirebaseAuthGuard)
  async initUser(
    @Param("uid") uid: string,
    @Req() req: FirebaseAuthGuardRequest
  ): Promise<object> {
    const clientUid = req.decodedIdToken?.uid;
    if (clientUid !== uid) {
      throw new ForbiddenException();
    }

    const newUser = await this.userService.init(uid);
    if (!newUser) {
      throw new ConflictException({
        message: "user with provided uid is already exist.",
      });
    }

    return { message: "ok" };
  }
}
