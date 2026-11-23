export type AuthMode = 'sign-in' | 'sign-up'

export type AuthMethod = 'password' | 'sso' | 'passkey'

/** Demo-only session: profile details for the shell. No credentials are ever stored. */
export interface UserSession {
  name: string
  email: string
  organization: string
  method: AuthMethod
}
