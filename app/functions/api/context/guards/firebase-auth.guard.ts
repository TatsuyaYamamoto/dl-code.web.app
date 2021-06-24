import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { auth } from "firebase-admin";

export interface FirebaseAuthGuardRequest extends Request {
  decodedIdToken?: auth.DecodedIdToken;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FirebaseAuthGuardRequest>();
    const authorizationHeader = req.header("Authorization");
    const idToken = authorizationHeader?.replace("Bearer ", "");

    if (!idToken) {
      throw new UnauthorizedException();
    }

    req.decodedIdToken = await auth()
      .verifyIdToken(idToken)
      .catch((e) => {
        throw new UnauthorizedException(e);
      });

    return true;
  }
}
