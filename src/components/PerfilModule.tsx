import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  User, 
  Mail, 
  Shield, 
  Key,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'administrativo';
}

interface PerfilModuleProps {
  user: User;
}

export function PerfilModule({ user }: PerfilModuleProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user.name
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'docente': return 'Docente';
      case 'administrativo': return 'Personal Administrativo';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'docente': return 'bg-green-100 text-green-800 border-green-200';
      case 'administrativo': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSaveProfile = () => {
    if (!profileForm.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    // Simular guardado
    toast.success('Perfil actualizado correctamente');
    setIsEditingProfile(false);
  };

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword) {
      toast.error('Ingresa tu contraseña actual');
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error('Ingresa una nueva contraseña');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Simular cambio de contraseña
    toast.success('Contraseña cambiada correctamente');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  const handleCancelEdit = () => {
    setProfileForm({
      name: user.name
    });
    setIsEditingProfile(false);
  };

  const handleCancelPassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal y configuración</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Información Personal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                {isEditingProfile ? (
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    placeholder="Ingresa tu nombre completo"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{user.name}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="flex items-center space-x-2 p-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{user.email}</span>
                  <Badge variant="outline" className="ml-auto text-xs bg-gray-100 text-gray-600">
                    No editable
                  </Badge>
                </div>
                {isEditingProfile && (
                  <p className="text-xs text-gray-500 mt-1">
                    El correo electrónico no puede ser modificado por razones de seguridad
                  </p>
                )}
              </div>

              <div>
                <Label>Cargo Administrativo</Label>
                <div className="flex items-center space-x-2 p-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <Badge variant="outline" className={getRoleColor(user.role)}>
                    {getRoleName(user.role)}
                  </Badge>
                </div>
              </div>

            </div>

            <Separator />

            <div className="flex space-x-3">
              {isEditingProfile ? (
                <>
                  <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cambio de Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Seguridad</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isChangingPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Mantén tu cuenta segura cambiando tu contraseña regularmente.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Última actualización</span>
                  </div>
                  <p className="text-sm text-gray-600">Hace 30 días</p>
                </div>
                <Button 
                  onClick={() => setIsChangingPassword(true)} 
                  variant="outline"
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      placeholder="Ingresa tu contraseña actual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      placeholder="Ingresa una nueva contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex space-x-3">
                  <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                  <Button variant="outline" onClick={handleCancelPassword}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Fecha de Registro</p>
              <p className="text-gray-600">15 de Enero, 2024</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Último Acceso</p>
              <p className="text-gray-600">Hoy a las 09:30 AM</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Estado de la Cuenta</p>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                Activa
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}