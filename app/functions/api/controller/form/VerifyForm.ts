import { IsNotEmpty } from "class-validator";

export class VerifyForm {
  @IsNotEmpty()
  downloadCode!: string;
}
