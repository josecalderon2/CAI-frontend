import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Settings, 
  School, 
  Save,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'administrativo';
}

interface ConfiguracionModuleProps {
  user: User;
}

export function ConfiguracionModule({ user }: ConfiguracionModuleProps) {
  // Solo el admin puede acceder a configuración
  if (user.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
              <p className="text-gray-600">Solo los administradores pueden acceder a la configuración del sistema</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [configuracion, setConfiguracion] = useState({
    nombreColegio: 'Colegio Amigos de Israel',
    direccion: 'Santa Ana, El Salvador',
    telefono: '+503 2441-1234',
    email: 'info@colegioamigos.edu',
    sitioWeb: 'www.colegioamigos.edu',
    anoEscolar: '2024',
    directora: 'Prof. Ana María Rodríguez',
    codigoInstitucional: 'CAI-001'
  });

  const [formData, setFormData] = useState({...configuracion});

  const handleSave = () => {
    if (!formData.nombreColegio.trim()) {
      toast.error('El nombre del colegio es obligatorio');
      return;
    }

    // Simular guardado
    setConfiguracion({...formData});
    setIsEditing(false);
    toast.success('Configuración guardada correctamente');
  };

  const handleCancel = () => {
    setFormData({...configuracion});
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Administra la configuración general del colegio</p>
        </div>
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          Solo Administradores
        </Badge>
      </div>

      {/* Información del Colegio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <School className="w-5 h-5" />
            <span>Información Institucional</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombreColegio">Nombre del Colegio *</Label>
              {isEditing ? (
                <Input
                  id="nombreColegio"
                  value={formData.nombreColegio}
                  onChange={(e) => setFormData({...formData, nombreColegio: e.target.value})}
                  placeholder="Nombre completo del colegio"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <School className="w-4 h-4 text-gray-500" />
                  <span>{configuracion.nombreColegio}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="codigoInstitucional">Código Institucional</Label>
              {isEditing ? (
                <Input
                  id="codigoInstitucional"
                  value={formData.codigoInstitucional}
                  onChange={(e) => setFormData({...formData, codigoInstitucional: e.target.value})}
                  placeholder="Código único del colegio"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <Badge variant="outline" className="font-mono">
                    {configuracion.codigoInstitucional}
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="directora">Director(a)</Label>
              {isEditing ? (
                <Input
                  id="directora"
                  value={formData.directora}
                  onChange={(e) => setFormData({...formData, directora: e.target.value})}
                  placeholder="Nombre del director(a)"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <span>{configuracion.directora}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="anoEscolar">Año Escolar</Label>
              {isEditing ? (
                <Input
                  id="anoEscolar"
                  value={formData.anoEscolar}
                  onChange={(e) => setFormData({...formData, anoEscolar: e.target.value})}
                  placeholder="Año escolar actual"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {configuracion.anoEscolar}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              {isEditing ? (
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Dirección completa"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{configuracion.direccion}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              {isEditing ? (
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="Número de teléfono"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{configuracion.telefono}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Institucional</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Email del colegio"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{configuracion.email}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="sitioWeb">Sitio Web</Label>
              {isEditing ? (
                <Input
                  id="sitioWeb"
                  value={formData.sitioWeb}
                  onChange={(e) => setFormData({...formData, sitioWeb: e.target.value})}
                  placeholder="Sitio web del colegio"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span>{configuracion.sitioWeb}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Editar Configuración
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuración del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configuración del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Usuarios Activos</h4>
                <p className="text-sm text-gray-600 mb-1">Administradores: 2</p>
                <p className="text-sm text-gray-600 mb-1">Personal Administrativo: 3</p>
                <p className="text-sm text-gray-600">Docentes: 15</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Datos del Sistema</h4>
                <p className="text-sm text-gray-600 mb-1">Alumnos registrados: 350</p>
                <p className="text-sm text-gray-600 mb-1">Cursos activos: 12</p>
                <p className="text-sm text-gray-600">Asignaturas: 18</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <School className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Información Importante</h4>
                  <p className="text-sm text-blue-700">
                    Los cambios en la configuración del colegio se aplicarán inmediatamente en todo el sistema. 
                    Asegúrate de que la información sea correcta antes de guardar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Cambios */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cambios Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium">Configuración actualizada</p>
                <p className="text-xs text-gray-500">20 de Enero, 2024 - 10:30 AM</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {user.name}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium">Año escolar actualizado a 2024</p>
                <p className="text-xs text-gray-500">15 de Enero, 2024 - 09:15 AM</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Admin Sistema
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}