type BackendRole = 'Admin' | 'P.A' | 'Orientador';
type FrontRole = 'admin' | 'administrativo' | 'orientador';

export function mapRoleToFront(r: BackendRole): FrontRole {
  switch (r) {
    case 'Admin':
      return 'admin';
    case 'P.A':
      return 'administrativo';
    case 'Orientador':
      return 'orientador';
  }
}

export function setAuth(data: { access_token: string; user: any }) {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getUser(): any | null {
  const raw = localStorage.getItem('user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
