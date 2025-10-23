import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'administrativo';
}

interface AsistenciaModuleProps {
  user: User;
}

interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  cursoId: string;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  asignatura: string;
  alumnos: number;
}

interface RegistroAsistencia {
  id: string;
  alumnoId: string;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tarde';
  observaciones?: string;
}

interface AsistenciaDiaria {
  id: string;
  cursoId: string;
  fecha: string;
  docenteId: string;
  registros: RegistroAsistencia[];
  totalPresentes: number;
  totalAusentes: number;
  totalTardes: number;
}

export function AsistenciaModule({ user }: AsistenciaModuleProps) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('tomar-asistencia');
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [asistenciaGuardada, setAsistenciaGuardada] = useState(false);

  // Datos simulados
  const cursosAsignados: Curso[] = [
    { id: '1', nombre: '3° Básico A', nivel: '3° Básico', asignatura: 'Matemáticas', alumnos: 30 },
    { id: '2', nombre: '4° Básico B', nivel: '4° Básico', asignatura: 'Matemáticas', alumnos: 28 },
    { id: '3', nombre: '5° Básico A', nivel: '5° Básico', asignatura: 'Ciencias', alumnos: 32 },
    { id: '4', nombre: '6° Básico C', nivel: '6° Básico', asignatura: 'Ciencias', alumnos: 30 },
  ];

  const alumnosPorCurso: { [key: string]: Alumno[] } = {
    '1': [
      { id: '1', nombre: 'Ana', apellido: 'García', rut: '12345678-9', cursoId: '1' },
      { id: '2', nombre: 'Carlos', apellido: 'López', rut: '12345679-0', cursoId: '1' },
      { id: '3', nombre: 'María', apellido: 'Rodríguez', rut: '12345680-1', cursoId: '1' },
      { id: '4', nombre: 'Diego', apellido: 'Martínez', rut: '12345681-2', cursoId: '1' },
      { id: '5', nombre: 'Sofía', apellido: 'Herrera', rut: '12345682-3', cursoId: '1' },
      { id: '6', nombre: 'Pedro', apellido: 'Silva', rut: '12345683-4', cursoId: '1' },
      { id: '7', nombre: 'Valentina', apellido: 'Torres', rut: '12345684-5', cursoId: '1' },
      { id: '8', nombre: 'Mateo', apellido: 'Vargas', rut: '12345685-6', cursoId: '1' },
    ],
    '2': [
      { id: '9', nombre: 'Isabella', apellido: 'Morales', rut: '12345686-7', cursoId: '2' },
      { id: '10', nombre: 'Sebastián', apellido: 'Castro', rut: '12345687-8', cursoId: '2' },
      { id: '11', nombre: 'Camila', apellido: 'Rojas', rut: '12345688-9', cursoId: '2' },
      { id: '12', nombre: 'Joaquín', apellido: 'Mendoza', rut: '12345689-0', cursoId: '2' },
    ],
    '3': [
      { id: '13', nombre: 'Emilia', apellido: 'Jiménez', rut: '12345690-1', cursoId: '3' },
      { id: '14', nombre: 'Nicolás', apellido: 'Paredes', rut: '12345691-2', cursoId: '3' },
      { id: '15', nombre: 'Antonella', apellido: 'Fuentes', rut: '12345692-3', cursoId: '3' },
    ],
    '4': [
      { id: '16', nombre: 'Benjamín', apellido: 'Soto', rut: '12345693-4', cursoId: '4' },
      { id: '17', nombre: 'Florencia', apellido: 'Díaz', rut: '12345694-5', cursoId: '4' },
    ],
  };

  const [asistenciaActual, setAsistenciaActual] = useState<{ [key: string]: { estado: 'presente' | 'ausente' | 'tarde', observaciones: string } }>({});

  const historialAsistencia: AsistenciaDiaria[] = [
    {
      id: '1',
      cursoId: '1',
      fecha: '2024-01-22',
      docenteId: user.id,
      registros: [],
      totalPresentes: 28,
      totalAusentes: 2,
      totalTardes: 0
    },
    {
      id: '2',
      cursoId: '1',
      fecha: '2024-01-21',
      docenteId: user.id,
      registros: [],
      totalPresentes: 30,
      totalAusentes: 0,
      totalTardes: 0
    },
    {
      id: '3',
      cursoId: '2',
      fecha: '2024-01-22',
      docenteId: user.id,
      registros: [],
      totalPresentes: 26,
      totalAusentes: 1,
      totalTardes: 1
    },
  ];

  const alumnosDelCurso = cursoSeleccionado ? (alumnosPorCurso[cursoSeleccionado] || []) : [];
  const alumnosFiltrados = alumnosDelCurso.filter(alumno =>
    `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
    alumno.rut.includes(busquedaAlumno)
  );

  const cursoActual = cursosAsignados.find(c => c.id === cursoSeleccionado);

  const handleEstadoChange = (alumnoId: string, estado: 'presente' | 'ausente' | 'tarde') => {
    setAsistenciaActual(prev => ({
      ...prev,
      [alumnoId]: {
        estado,
        observaciones: prev[alumnoId]?.observaciones || ''
      }
    }));
  };

  const handleObservacionesChange = (alumnoId: string, observaciones: string) => {
    setAsistenciaActual(prev => ({
      ...prev,
      [alumnoId]: {
        estado: prev[alumnoId]?.estado || 'presente',
        observaciones
      }
    }));
  };

  const handleGuardarAsistencia = () => {
    if (!cursoSeleccionado) {
      toast.error('Debe seleccionar un curso');
      return;
    }

    // Simular guardado
    console.log('Guardando asistencia:', {
      curso: cursoSeleccionado,
      fecha: fechaSeleccionada,
      asistencia: asistenciaActual
    });

    setAsistenciaGuardada(true);
    toast.success('Asistencia guardada correctamente');
  };

  const marcarTodosPresentes = () => {
    const nuevaAsistencia: { [key: string]: { estado: 'presente' | 'ausente' | 'tarde', observaciones: string } } = {};
    alumnosDelCurso.forEach(alumno => {
      nuevaAsistencia[alumno.id] = { estado: 'presente', observaciones: '' };
    });
    setAsistenciaActual(nuevaAsistencia);
    toast.success('Todos los alumnos marcados como presentes');
  };

  const contarEstados = () => {
    const estados = Object.values(asistenciaActual);
    return {
      presentes: estados.filter(a => a.estado === 'presente').length,
      ausentes: estados.filter(a => a.estado === 'ausente').length,
      tardes: estados.filter(a => a.estado === 'tarde').length,
      sinMarcar: alumnosDelCurso.length - estados.length
    };
  };

  const estadosCount = contarEstados();

  const renderTomarAsistencia = () => (
    <div className="space-y-6">
      {/* Selección de curso y fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Configuración de Asistencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curso">Curso</Label>
              <Select value={cursoSeleccionado} onValueChange={setCursoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursosAsignados.map(curso => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nombre} - {curso.asignatura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
              />
            </div>
          </div>

          {cursoSeleccionado && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Curso seleccionado: <strong>{cursoActual?.nombre}</strong> - {cursoActual?.asignatura} 
                ({alumnosDelCurso.length} alumnos)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {cursoSeleccionado && (
        <>
          {/* Resumen de asistencia */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-blue-600">{alumnosDelCurso.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Presentes</p>
                    <p className="text-2xl font-bold text-green-600">{estadosCount.presentes}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ausentes</p>
                    <p className="text-2xl font-bold text-red-600">{estadosCount.ausentes}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tardes</p>
                    <p className="text-2xl font-bold text-orange-600">{estadosCount.tardes}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sin marcar</p>
                    <p className="text-2xl font-bold text-gray-600">{estadosCount.sinMarcar}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controles rápidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5" />
                <span>Controles Rápidos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={marcarTodosPresentes} variant="outline" size="sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar Todos Presentes
                </Button>
                <Button 
                  onClick={handleGuardarAsistencia} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={estadosCount.sinMarcar > 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Asistencia
                </Button>
              </div>
              {estadosCount.sinMarcar > 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  Quedan {estadosCount.sinMarcar} alumnos sin marcar asistencia
                </p>
              )}
            </CardContent>
          </Card>

          {/* Lista de alumnos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Lista de Alumnos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar alumno..."
                      value={busquedaAlumno}
                      onChange={(e) => setBusquedaAlumno(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alumnosFiltrados.map((alumno) => {
                  const estadoActual = asistenciaActual[alumno.id];
                  return (
                    <div key={alumno.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{alumno.nombre} {alumno.apellido}</p>
                        <p className="text-sm text-gray-600">RUT: {alumno.rut}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={estadoActual?.estado === 'presente' ? 'default' : 'outline'}
                            onClick={() => handleEstadoChange(alumno.id, 'presente')}
                            className={estadoActual?.estado === 'presente' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={estadoActual?.estado === 'ausente' ? 'default' : 'outline'}
                            onClick={() => handleEstadoChange(alumno.id, 'ausente')}
                            className={estadoActual?.estado === 'ausente' ? 'bg-red-600 hover:bg-red-700' : ''}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={estadoActual?.estado === 'tarde' ? 'default' : 'outline'}
                            onClick={() => handleEstadoChange(alumno.id, 'tarde')}
                            className={estadoActual?.estado === 'tarde' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Observaciones - {alumno.nombre} {alumno.apellido}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <Textarea
                                  id="observaciones"
                                  placeholder="Ingrese observaciones sobre la asistencia..."
                                  value={estadoActual?.observaciones || ''}
                                  onChange={(e) => handleObservacionesChange(alumno.id, e.target.value)}
                                />
                              </div>
                              <Button onClick={() => toast.success('Observaciones guardadas')}>
                                Guardar Observaciones
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {asistenciaGuardada && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                La asistencia del {fechaSeleccionada} para {cursoActual?.nombre} ha sido guardada correctamente.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );

  const renderHistorial = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Historial de Asistencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historialAsistencia.map((registro) => {
              const curso = cursosAsignados.find(c => c.id === registro.cursoId);
              const porcentajeAsistencia = ((registro.totalPresentes + registro.totalTardes) / (registro.totalPresentes + registro.totalAusentes + registro.totalTardes) * 100).toFixed(1);
              
              return (
                <div key={registro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{curso?.nombre}</p>
                        <p className="text-sm text-gray-600">{registro.fecha}</p>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {porcentajeAsistencia}% asistencia
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Presentes</p>
                      <p className="font-semibold text-green-600">{registro.totalPresentes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Ausentes</p>
                      <p className="font-semibold text-red-600">{registro.totalAusentes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Tardes</p>
                      <p className="font-semibold text-orange-600">{registro.totalTardes}</p>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportes = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Reportes de Asistencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curso-reporte">Curso</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cursos</SelectItem>
                  {cursosAsignados.map(curso => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Último mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultima-semana">Última semana</SelectItem>
                  <SelectItem value="ultimo-mes">Último mes</SelectItem>
                  <SelectItem value="ultimo-trimestre">Último trimestre</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Descargar Excel
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa del reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa - Resumen de Asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cursosAsignados.slice(0, 2).map((curso) => (
              <div key={curso.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{curso.nombre} - {curso.asignatura}</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Días registrados</p>
                    <p className="font-semibold">20</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Promedio asistencia</p>
                    <p className="font-semibold text-green-600">92.5%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total ausencias</p>
                    <p className="font-semibold text-red-600">45</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total atrasos</p>
                    <p className="font-semibold text-orange-600">12</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Asistencia</h1>
          <p className="text-gray-600 mt-1">Control y seguimiento de asistencia por cursos</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Calendar className="w-4 h-4 mr-1" />
          Docente
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tomar-asistencia" className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>Tomar Asistencia</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Reportes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tomar-asistencia">
          {renderTomarAsistencia()}
        </TabsContent>

        <TabsContent value="historial">
          {renderHistorial()}
        </TabsContent>

        <TabsContent value="reportes">
          {renderReportes()}
        </TabsContent>
      </Tabs>
    </div>
  );
}