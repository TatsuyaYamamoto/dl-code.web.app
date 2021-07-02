export interface VerifyResult {
  valid: boolean;
  /**
   * validがfalseなら、undefined
   */
  data?: {
    productId: string;
    expiredAt: string;
  };
}
