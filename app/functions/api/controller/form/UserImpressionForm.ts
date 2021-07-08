import { IsNotEmpty } from "class-validator";

export class UserImpressionForm {
  @IsNotEmpty()
  productId!: string;

  @IsNotEmpty()
  text!: string;
}
