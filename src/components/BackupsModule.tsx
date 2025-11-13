import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Database,
  HardDrive,
  Cloud,
  Download,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  FolderOpen,
} from 'lucide-react';

export function BackupsModule() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    success: boolean;
    mensaje: string;
    url?: string;
  } | null>(null);

  const ejecutarBackup = async () => {
    setLoading(true);
    setResultado(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/backup/ejecutar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setResultado({
          success: true,
          mensaje: '✅ Backup generado y subido exitosamente a Google Drive',
          url: data.url,
        });
      } else {
        setResultado({
          success: false,
          mensaje: `❌ Error: ${data.error}`,
        });
      }
    } catch (error) {
      setResultado({
        success: false,
        mensaje: '❌ Error de conexión al ejecutar el backup',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Respaldos (Backups)
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de copias de seguridad de la base de datos
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-cyan-50 text-cyan-700 border-cyan-200"
        >
          <Database className="w-4 h-4 mr-1" />
          Backups Automáticos
        </Badge>
      </div>

      {/* Card de información importante */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">
                ℹ️ Información sobre los Respaldos
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>¿Dónde se guardan los backups?</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Localmente (servidor):</strong> Se guardan
                    temporalmente en la carpeta{' '}
                    <code className="bg-blue-100 px-2 py-0.5 rounded">
                      /backups
                    </code>{' '}
                    del servidor backend. Estos archivos se eliminan
                    automáticamente después de subirlos a Drive para ahorrar
                    espacio.
                  </li>
                  <li>
                    <strong>Google Drive (nube):</strong> Se suben
                    automáticamente a Google Drive en la carpeta configurada por
                    el administrador del sistema. Los backups en Drive se
                    mantienen permanentemente y{' '}
                    <strong>NO se eliminan automáticamente</strong>.
                  </li>
                </ul>
                <p className="mt-3">
                  <strong>Formato del archivo:</strong> Los backups se generan
                  en formato SQL con el nombre{' '}
                  <code className="bg-blue-100 px-2 py-0.5 rounded">
                    backup-YYYY-MM-DD-HH-MM-SS.sql
                  </code>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Generar Backup */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-cyan-600" />
              <span>Generar Backup Manual</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Genera un respaldo completo de la base de datos PostgreSQL y lo
              sube automáticamente a Google Drive.
            </p>

            <Button
              onClick={ejecutarBackup}
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Ejecutar Backup Ahora
                </>
              )}
            </Button>

            {resultado && (
              <div
                className={`p-4 rounded-lg border ${
                  resultado.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {resultado.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-2 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        resultado.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {resultado.mensaje}
                    </p>
                    {resultado.url && (
                      <a
                        href={resultado.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <Cloud className="w-4 h-4" />
                        <span>Ver en Google Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Ubicaciones de Almacenamiento */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-orange-600" />
              <span>Ubicaciones de Almacenamiento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Almacenamiento Local */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-3">
                <HardDrive className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    📂 Almacenamiento Local (Temporal)
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Carpeta en el servidor backend:
                  </p>
                  <code className="text-xs bg-white px-3 py-2 rounded border border-gray-300 block">
                    /ruta/del/servidor/backups/
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Los archivos locales se eliminan automáticamente después
                    de subirlos a Drive.
                  </p>
                </div>
              </div>
            </div>

            {/* Almacenamiento en Drive */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <Cloud className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">
                    ☁️ Google Drive (Permanente)
                  </h4>
                  <p className="text-sm text-green-700 mb-2">
                    Los backups se almacenan permanentemente en Google Drive.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    ✅ Los backups en Drive NO se eliminan automáticamente y
                    están disponibles siempre.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card informativa adicional */}
      <Card className="border-l-4 border-l-amber-500 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-900">
                ⚠️ Recomendaciones Importantes
              </h3>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside ml-2">
                <li>
                  Se recomienda generar backups antes de realizar cambios
                  importantes en el sistema
                </li>
                <li>
                  Los backups automáticos se ejecutan según la configuración del
                  servidor
                </li>
                <li>
                  Verifica periódicamente que los backups se estén generando
                  correctamente
                </li>
                <li>
                  Mantén acceso a la cuenta de Google Drive configurada para los
                  backups
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BackupsModule;
