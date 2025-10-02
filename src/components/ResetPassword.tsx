import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

import { Eye, EyeOff, Lock, CheckCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/axiosConfig';
// Si quieres mostrar el mismo logo del login, descomenta y ajusta:
// import logo from 'figma:asset/9139a873c68ec4425ee968f9ad7451084ffd6a1b.png';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // El token viene del enlace del correo: /reset-password?token=XYZ
  const token = useMemo(() => params.get('token') || '', [params]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setFormError('El enlace no es válido o ha expirado.');
  }, [token]);

  // Ajusta esta política para que refleje la del backend
  const policy = {
    min: 8,
    requireUpper: true,
    requireLower: true,
    requireDigit: true,
  };

  const checks = {
    length: password.length >= policy.min,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    match: password.length > 0 && password === confirm,
  };

  const strength = (() => {
    let s = 0;
    if (checks.length) s++;
    if (checks.upper) s++;
    if (checks.lower) s++;
    if (checks.digit) s++;
    if (checks.match) s++;
    return s; // 0–5
  })();

  const canSubmit = token && Object.values(checks).every(Boolean) && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!canSubmit) return;

    setLoading(true);
    try {
      // ⬇️ Cambia la ruta si tu backend usa otra (ej. '/auth/password/reset')
      await api.post('/auth/reset-password', { token, password });

      setDone(true);
      toast.success('Contraseña restablecida correctamente');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'No se pudo restablecer la contraseña';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
      toast.error('Ocurrió un error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-6">
          {/* <div className="mx-auto mb-3 w-16 h-16">
            <img src={logo} alt="Colegio Amigos de Israel" className="w-full h-full object-contain" />
          </div> */}
          <div className="flex items-center justify-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-700" />
            <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ingresa tu nueva contraseña y confírmala.
          </p>
        </CardHeader>

        <CardContent>
          {!token && (
            <Alert className="border-red-200 bg-red-50 mb-2">
              <AlertDescription className="text-red-700">
                El enlace no es válido o ha expirado. Solicita uno nuevo desde “¿Olvidaste tu contraseña?”.
              </AlertDescription>
            </Alert>
          )}

          {formError && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertDescription className="text-red-700">{formError}</AlertDescription>
            </Alert>
          )}

          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nueva contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmación */}
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checklist de reglas */}
              <ul className="text-xs text-gray-600 space-y-1">
                <CheckItem ok={checks.length} text={`Mínimo ${policy.min} caracteres`} />
                <CheckItem ok={checks.upper} text="Al menos una mayúscula (A-Z)" />
                <CheckItem ok={checks.lower} text="Al menos una minúscula (a-z)" />
                <CheckItem ok={checks.digit} text="Al menos un número (0-9)" />
                <CheckItem ok={checks.match} text="Las contraseñas coinciden" />
              </ul>

              {/* Barra de fuerza */}
              <div className="h-2 rounded bg-gray-200 overflow-hidden">
                <div
                  className={`h-full ${strength <= 2 ? 'bg-red-400' : strength <= 4 ? 'bg-yellow-400' : 'bg-green-500'}`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                />
              </div>

              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">¡Listo!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tu contraseña fue restablecida. Te redirigiremos al inicio de sesión…
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CheckItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-green-700' : ''}`}>
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-600' : 'bg-gray-300'}`} />
      {text}
    </li>
  );
}
