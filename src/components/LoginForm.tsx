import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail } from 'lucide-react';

// Components
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

// Utilities
import { api } from '../api/axiosConfig';
import { setAuth } from '../utils/auth';
import logo from '../../public/logoCai.png';

// Constants
const APP_CONFIG = {
  schoolName: 'Colegio Amigos de Israel',
  location: 'Santa Ana, El Salvador',
  systemName: 'Sistema de Gestión Académica',
  emailPlaceholder: 'usuario@colegioamigos.edu',
  logoSize: { width: 80, height: 80 },
} as const;

// Types
interface LoginFormData {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    role: string;
  };
}

interface IconInputProps {
  id: string;
  type: 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  label: string;
  required?: boolean;
}

// Memoized IconInput Component
const IconInput = ({
  id,
  type,
  value,
  onChange,
  placeholder,
  icon,
  label,
  required = true,
}: IconInputProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {icon}
      </span>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
        required={required}
      />
    </div>
  </div>
);

// Error handling utility
const getErrorMessage = (error: any): string => {
  if (!error?.response) return 'Error de conexión';

  const { status, data } = error.response;
  const defaultMessage = 'Error al iniciar sesión';

  if (data?.message) {
    return `(${status}) ${Array.isArray(data.message) ? data.message.join(', ') : data.message}`;
  }

  return `(${status}) ${defaultMessage}`;
};

// Type guard
const isAuthResponse = (data: any): data is AuthResponse =>
  data && typeof data.access_token === 'string' && data.user !== undefined;

// ===== Componente de modal: Recuperar Contraseña (solo frontend) =====
function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const resetState = () => { setMsg(null); setErr(null); };

  const handleSend = async () => {
    resetState();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) { setErr('Ingresa un correo válido'); return; }

    setSending(true);
    try {
      // Ajusta la ruta si tu backend usa otra
      await api.post('/auth/forgot-password', { email });
      setMsg('Te enviamos un enlace para restablecer tu contraseña (si el correo existe).');
    } catch {
      setErr('No se pudo enviar el enlace. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperar Contraseña</DialogTitle>
          <DialogDescription>
            Te enviaremos un enlace para restablecer tu contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="forgot-email">Correo Electrónico</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <Input
              id="forgot-email"
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? 'Enviando…' : 'Enviar Enlace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Login =====
export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false); // NUEVO
  const navigate = useNavigate();

  // Memoized configuration
  const config = useMemo(() => APP_CONFIG, []);

  // Optimized input change handler
  const handleInputChange = useCallback(
    (field: keyof LoginFormData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (error) setError(null);
    },
    [error]
  );

  // Form submission handler (SIN CAMBIOS)
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const { data } = await api.post<AuthResponse>('/auth/login', formData);
        if (isAuthResponse(data)) {
          setAuth(data);
          navigate('/admin', { replace: true });
        } else {
          throw new Error('Respuesta del servidor inválida');
        }
      } catch (err: any) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [formData, navigate]
  );

  // Memoized form inputs configuration
  const formInputs = useMemo(
    () => [
      {
        id: 'email',
        type: 'email' as const,
        value: formData.email,
        placeholder: config.emailPlaceholder,
        icon: <User className="w-4 h-4" />,
        label: 'Correo Electrónico',
      },
      {
        id: 'password',
        type: 'password' as const,
        value: formData.password,
        placeholder: '••••••••',
        icon: <Lock className="w-4 h-4" />,
        label: 'Contraseña',
      },
    ],
    [formData.email, formData.password, config.emailPlaceholder]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-8">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={config.logoSize}
          >
            <img
              src={logo}
              alt={config.schoolName}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <CardTitle className="text-2xl mb-2">{config.systemName}</CardTitle>
          <p className="text-sm text-muted-foreground">{config.schoolName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {config.location}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formInputs.map((input) => (
              <IconInput
                key={input.id}
                {...input}
                onChange={handleInputChange(input.id as keyof LoginFormData)}
              />
            ))}

            {/* Botón de inicio de sesión: ancho completo */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            {/* Recuperar contraseña debajo, centrado y estilo pill */}
            <div className="mt-3 text-center">
              <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className='"inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"'
            >
              ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <p
                className="text-center text-sm text-red-600 animate-pulse"
                role="alert"
              >
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Modal de recuperación */}
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
}

export default LoginForm;
