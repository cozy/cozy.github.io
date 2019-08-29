export const isLoginFailed = error =>
  error.message && error.message.includes('LOGIN_FAILED')
