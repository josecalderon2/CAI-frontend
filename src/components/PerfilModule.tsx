import { useState, useEffect } from 'react';
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
  EyeOff,
  Phone,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { perfilService, type UserProfile } from '../api/services/perfilService';
import { getUser } from '../utils/auth';

interface PerfilModuleProps {
  // Sin props necesarias por ahora
}

export function PerfilModule({}: PerfilModuleProps) {
  // Usar directamente getUser para obtener los datos del usuario autenticado
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userAuthData, setUserAuthData] = useState<any>(null);

  const [profileForm, setProfileForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
  });
  // Helper: valida y formatea teléfono a XXXX-XXXX
  const normalizeDigits = (s: string) => s.replace(/\D/g, '');
  const isValidPhone = (s: string) => normalizeDigits(s).length === 8;
  const formatPhone = (s: string) => {
    const d = normalizeDigits(s);
    if (d.length !== 8) return s;
    return `${d.slice(0, 4)}-${d.slice(4)}`;
  };

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Función para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const authData = getUser();
        setUserAuthData(authData);

        if (!authData || !authData.role) {
          console.error('No hay información de rol en los datos del usuario');
          toast.error('No se pudo obtener la información del usuario');
          setIsLoading(false);
          return;
        }

        const profile = await perfilService.getPerfilUsuario(authData.role);

        setUserProfile(profile);
        setProfileForm({
          nombre: profile.nombre || '',
          apellido: profile.apellido || '',
          telefono: profile.telefono || '',
          direccion: profile.direccion || '',
        });
      } catch (error: any) {
        console.error('Error al cargar el perfil:', error);

        // Mensajes más específicos según el error
        if (error.response?.status === 403) {
          toast.error('No tienes permisos para acceder a esta información');
        } else if (error.response?.status === 404) {
          toast.error('No se encontró la información del perfil');
        } else {
          toast.error('No se pudo cargar la información del perfil');
        }

        // Como alternativa, podríamos intentar usar los datos que ya tenemos en localStorage
        const fallbackData = getUser();
        if (fallbackData && fallbackData.nombre && fallbackData.email) {
          toast.info('Usando información básica del perfil');
          setUserProfile({
            nombre: fallbackData.nombre || '',
            apellido: fallbackData.apellido || '',
            email: fallbackData.email || '',
            cargoAdministrativo: {
              nombre: getRoleName(fallbackData.role || ''),
            },
          } as UserProfile);

          setProfileForm({
            nombre: fallbackData.nombre || '',
            apellido: fallbackData.apellido || '',
            telefono: fallbackData.telefono || '',
            direccion: fallbackData.direccion || '',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!profileForm.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!profileForm.apellido.trim()) {
      toast.error('El apellido es obligatorio');
      return;
    }

    // Validar que nombre y apellido no contengan números
    if (/\d/.test(profileForm.nombre)) {
      toast.error('El nombre no puede contener números');
      return;
    }

    if (/\d/.test(profileForm.apellido)) {
      toast.error('El apellido no puede contener números');
      return;
    }

    // Validar teléfono si se ingresó
    if (profileForm.telefono) {
      if (!isValidPhone(profileForm.telefono)) {
        toast.error('El teléfono debe tener 8 dígitos. Ejemplo: 1111-1111');
        return;
      }
      // Asegurar formato antes de enviar
      profileForm.telefono = formatPhone(profileForm.telefono);
    }

    try {
      if (!userAuthData?.role) {
        toast.error('No se pudo obtener la información del usuario');
        return;
      }

      await perfilService.updatePerfil(userAuthData.role, {
        nombre: profileForm.nombre,
        apellido: profileForm.apellido,
        telefono: profileForm.telefono,
        direccion: profileForm.direccion,
      });

      // Actualizar el perfil local
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          nombre: profileForm.nombre,
          apellido: profileForm.apellido,
          telefono: profileForm.telefono,
          direccion: profileForm.direccion,
        });
      }

      toast.success('Perfil actualizado correctamente');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      toast.error('No se pudo actualizar el perfil');
    }
  };

  const handleChangePassword = async () => {
    // Validación de contraseña actual
    if (!passwordForm.currentPassword) {
      toast.error('Ingresa tu contraseña actual');
      return;
    }

    // Validación de nueva contraseña
    if (!passwordForm.newPassword) {
      toast.error('Ingresa una nueva contraseña');
      return;
    }

    // Validación de longitud mínima
    if (passwordForm.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Validación de complejidad de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      toast.error(
        'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
      );
      return;
    }

    // Validación de coincidencia de contraseñas
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Validación para evitar que la nueva contraseña sea igual a la actual
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      if (!userAuthData?.role) {
        toast.error('No se pudo obtener la información del usuario');
        return;
      }

      // El backend ahora maneja la validación de la contraseña actual
      await perfilService.updatePerfil(userAuthData.role, {
        password: passwordForm.newPassword,
        currentPassword: passwordForm.currentPassword,
      });

      toast.success('Contraseña cambiada correctamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      toast.error('No se pudo cambiar la contraseña');
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setProfileForm({
        nombre: userProfile.nombre,
        apellido: userProfile.apellido,
        telefono: userProfile.telefono || '',
        direccion: userProfile.direccion || '',
      });
    }
    setIsEditingProfile(false);
  };

  const handleCancelPassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsChangingPassword(false);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'Administrador';
      case 'P.A':
        return 'Personal Administrativo';
      case 'Orientador':
        return 'Orientador';
      case 'admin':
        return 'Administrador';
      case 'administrativo':
        return 'Personal Administrativo';
      case 'orientador':
        return 'Orientador';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Orientador':
      case 'orientador':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'P.A':
      case 'administrativo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : userProfile ? (
        <>
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                {`${userProfile.nombre?.charAt(0) || ''}${userProfile.apellido?.charAt(0) || ''}`}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">
                Gestiona tu información personal y configuración
              </p>
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
                  {/* Nombre */}
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    {isEditingProfile ? (
                      <Input
                        id="nombre"
                        value={profileForm.nombre}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            nombre: e.target.value.replace(/[0-9]/g, ''),
                          })
                        }
                        placeholder="Ingresa tu nombre"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{userProfile.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Apellido */}
                  <div>
                    <Label htmlFor="apellido">Apellido</Label>
                    {isEditingProfile ? (
                      <Input
                        id="apellido"
                        value={profileForm.apellido}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            apellido: e.target.value.replace(/[0-9]/g, ''),
                          })
                        }
                        placeholder="Ingresa tu apellido"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{userProfile.apellido}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="flex items-center space-x-2 p-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{userProfile.email}</span>
                      <Badge
                        variant="outline"
                        className="ml-auto text-xs bg-gray-100 text-gray-600"
                      >
                        No editable
                      </Badge>
                    </div>
                    {isEditingProfile && (
                      <p className="text-xs text-gray-500 mt-1">
                        El correo electrónico no puede ser modificado por
                        razones de seguridad
                      </p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    {isEditingProfile ? (
                      <Input
                        id="telefono"
                        value={profileForm.telefono}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            // mantener solo dígitos y formatear automáticamente cuando tenga 8
                            telefono: formatPhone(
                              e.target.value.replace(/[^\d]/g, '')
                            ),
                          })
                        }
                        placeholder="Ingresa tu teléfono (ej. 7491-5623)"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{userProfile.telefono || 'No disponible'}</span>
                      </div>
                    )}
                  </div>

                  {/* DUI (si está disponible) */}
                  {userProfile.dui && (
                    <div>
                      <Label>DUI</Label>
                      <div className="flex items-center space-x-2 p-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span>{userProfile.dui}</span>
                      </div>
                    </div>
                  )}

                  {/* Dirección */}
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    {isEditingProfile ? (
                      <Input
                        id="direccion"
                        value={profileForm.direccion}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            direccion: e.target.value,
                          })
                        }
                        placeholder="Ingresa tu dirección"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{userProfile.direccion || 'No disponible'}</span>
                      </div>
                    )}
                  </div>

                  {/* Cargo Administrativo */}
                  <div>
                    <Label>Cargo</Label>
                    <div className="flex items-center space-x-2 p-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <Badge
                        variant="outline"
                        className={getRoleColor(userAuthData?.role || '')}
                      >
                        {userProfile.cargoAdministrativo?.nombre ||
                          getRoleName(userAuthData?.role || '')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex space-x-3">
                  {isEditingProfile ? (
                    <>
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      variant="outline"
                    >
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
                      Mantén tu cuenta segura cambiando tu contraseña
                      regularmente.
                    </p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Key className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          Última actualización
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {userProfile.updatedAt
                          ? formatDate(userProfile.updatedAt)
                          : 'No disponible'}
                      </p>
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
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Ingresa tu contraseña actual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          placeholder="Ingresa una nueva contraseña"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <p>La contraseña debe tener:</p>
                        <ul className="list-disc pl-4">
                          <li>Mínimo 8 caracteres</li>
                          <li>Al menos una letra mayúscula</li>
                          <li>Al menos una letra minúscula</li>
                          <li>Al menos un número</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">
                        Confirmar Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirma tu nueva contraseña"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex space-x-3">
                      <Button
                        onClick={handleChangePassword}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
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
                  <p className="text-gray-600">
                    {formatDate(userProfile.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">
                    Última Actualización
                  </p>
                  <p className="text-gray-600">
                    {formatDate(userProfile.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">
                    Estado de la Cuenta
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      userProfile.activo
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }
                  >
                    {userProfile.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center p-8">
          <p className="text-lg text-gray-600">
            No se pudo cargar la información del perfil
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
