declare module 'passport-jwt' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface ExtractJwtInterface {
    fromHeader(headerName: string): JwtFromRequestFunction;
    fromBodyField(fieldName: string): JwtFromRequestFunction;
    fromUrlQueryParameter(paramName: string): JwtFromRequestFunction;
    fromAuthHeaderWithScheme(authScheme: string): JwtFromRequestFunction;
    fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
    fromExtractors(extractors: JwtFromRequestFunction[]): JwtFromRequestFunction;
  }

  export type JwtFromRequestFunction = (request: any) => string | null;
  export type SecretOrKeyProvider = (request: any, rawJwtToken: any, done: (err: any, secretOrKey?: string | Buffer) => void) => void;

  export interface StrategyOptions {
    secretOrKey?: string | Buffer;
    secretOrKeyProvider?: SecretOrKeyProvider;
    jwtFromRequest: JwtFromRequestFunction;
    issuer?: string;
    audience?: string | string[];
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback?: boolean;
    jsonWebTokenOptions?: object;
  }

  export interface VerifiedCallback {
    (error: any, user?: any, info?: any): void;
  }

  export interface VerifyCallback {
    (payload: any, done: VerifiedCallback): void;
  }

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyCallback);
    name: string;
    authenticate(req: any, options?: any): void;
  }

  export const ExtractJwt: ExtractJwtInterface;
}
