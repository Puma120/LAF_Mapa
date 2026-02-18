import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface User {
  username: string;
  displayName: string;
  role: 'admin' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Usuarios mock — reemplazar con base de datos real en el futuro
const MOCK_USERS: { username: string; password: string; displayName: string; role: 'admin' | 'viewer' }[] = [
  { username: 'admin', password: 'laf2024', displayName: 'Administrador LAF', role: 'admin' },
  { username: 'investigador', password: 'ibero2024', displayName: 'Investigador', role: 'admin' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Recuperar sesión del localStorage
    const saved = localStorage.getItem('laf_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = useCallback(async (username: string, password: string) => {
    // Simular delay de red
    await new Promise(r => setTimeout(r, 600));

    const found = MOCK_USERS.find(
      u => u.username === username && u.password === password
    );

    if (found) {
      const userData: User = {
        username: found.username,
        displayName: found.displayName,
        role: found.role,
      };
      setUser(userData);
      localStorage.setItem('laf_user', JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Usuario o contraseña incorrectos' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('laf_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
