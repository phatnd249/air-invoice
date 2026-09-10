export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
