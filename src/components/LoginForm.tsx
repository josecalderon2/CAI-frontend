import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, Lock } from 'lucide-react';
import logo from '../../public/logoCai.png';

// Constantes para evitar valores hardcodeados
const APP_CONFIG = {
  schoolName: 'Colegio Amigos de Israel',
  location: 'Santa Ana, El Salvador',
  systemName: 'Sistema de Gestión Académica',
  emailPlaceholder: 'usuario@colegioamigos.edu',
  logoSize: { width: 80, height: 80 }
} as const;

// Interface para el formulario
interface LoginFormData {
  email: string;
  password: string;
}

// Componente de Input con icono reutilizable
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

const IconInput = ({ 
  id, 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon, 
  label, 
  required = true 
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

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const handleInputChange = (field: keyof LoginFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de autenticación aquí
    console.log('Datos del formulario:', formData);
  };

  const { email, password } = formData;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-8">
          <div 
            className="mx-auto mb-4 flex items-center justify-center"
            style={{ 
              width: APP_CONFIG.logoSize.width, 
              height: APP_CONFIG.logoSize.height 
            }}
          >
            <img 
              src={logo} 
              alt={APP_CONFIG.schoolName} 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl mb-2">
            {APP_CONFIG.systemName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {APP_CONFIG.schoolName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {APP_CONFIG.location}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <IconInput
              id="email"
              type="email"
              value={email}
              onChange={handleInputChange('email')}
              placeholder={APP_CONFIG.emailPlaceholder}
              icon={<User className="w-4 h-4" />}
              label="Correo Electrónico"
            />
            
            <IconInput
              id="password"
              type="password"
              value={password}
              onChange={handleInputChange('password')}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              label="Contraseña"
            />

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;