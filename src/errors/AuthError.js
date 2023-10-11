import { BaseError } from "./BaseError";

export class AuthError extends BaseError {
  constructor(message, status = 404) {
    super(message, status);
  }
}
