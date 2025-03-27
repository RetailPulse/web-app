export interface DecodedToken {
  aud: string;
  exp: Date;
  iat: Date;
  jti: string;
  nbf:Date;
  roles: Array<string>;
  sub: string;
  scope: any;
}