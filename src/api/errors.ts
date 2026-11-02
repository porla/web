export class RpcError extends Error {
  code: number;
  message: string;
  data: unknown;

  constructor(code: number, message: string, data: unknown) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.message = message;
    this.data = data;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
