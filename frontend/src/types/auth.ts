export interface SignupData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: 'user' | 'lawyer';
}

export interface LoginData {
  emailOrMobile: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'user' | 'lawyer';
}

export interface AuthResponse {
  user: User;
  token: string;
}
