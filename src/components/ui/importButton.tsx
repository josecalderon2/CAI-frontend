import React, { useRef, useState } from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportButtonProps {
  onImport: (file: File) => Promise<any> | void;
  triggerLabel?: string;
  maxSizeBytes?: number;
  accept?: string;
}

const ACCEPTED_MIME = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function ImportButton({
  onImport,
  triggerLabel = 'Importar',
  maxSizeBytes = 10 * 1024 * 1024,
  accept = '.xls,.xlsx,.csv',
}: ImportButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = ''; // ← permite re-seleccionar el mismo archivo
    }
  };

  const humanMB = (bytes: number) =>
    new Intl.NumberFormat('es-SV', { maximumFractionDigits: 1 }).format(
      bytes / (1024 * 1024)
    );

  const validateFile = (f: File) => {
    if (!f) return 'Archivo inválido';

    const nameOk = /\.(xls|xlsx|csv)$/i.test(f.name);
    const mimeOk =
      !f.type ||
      ACCEPTED_MIME.includes(f.type) ||
      /excel|spreadsheet|csv/i.test(f.type);

    if (!nameOk && !mimeOk)
      return 'Tipo de archivo no válido. Usa .xls, .xlsx o .csv';

    if (f.size > maxSizeBytes)
      return `Archivo demasiado grande (máx. ${humanMB(maxSizeBytes)} MB)`;

    return null;
  };

  const handleSelectClick = () => {
    resetInput();
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setError(null);
      return;
    }
    const validation = validateFile(f);
    if (validation) {
      setFile(null);
      setError(validation);
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Selecciona un archivo antes de importar');
      return;
    }
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Importando...');
    try {
      await onImport(file); // ← no relanzamos el error
      toast.success('Importación completada');
      setOpen(false);
      setFile(null);
      setError(null);
      resetInput();
    } catch (err: unknown) {
      const msg = (err as any)?.message || 'Error durante la importación';
      toast.error(msg);
      setError(msg);
    } finally {
      toast.dismiss(loadingToast);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileText className="w-4 h-4 mr-2" />
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            // ← limpiar estado también si se cierra con ESC/X
            setFile(null);
            setError(null);
            setIsLoading(false);
            resetInput();
          }
        }}
      >
        <DialogContent aria-busy={isLoading}>
          <DialogHeader>
            <DialogTitle>Importar Matrícula</DialogTitle>
            <DialogDescription>
              Selecciona un archivo Excel o CSV que contenga la hoja “Alumnos”.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <Button
                onClick={handleSelectClick}
                variant="outline"
                disabled={isLoading}
              >
                Seleccionar archivo
              </Button>

              <div className="mt-2 sm:mt-0">
                {file ? (
                  <p className="text-sm text-gray-700">
                    Archivo seleccionado:{' '}
                    <span className="font-medium">{file.name}</span>
                    {' · '}
                    <span>{humanMB(file.size)} MB</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Ningún archivo seleccionado
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-600 mt-1" aria-live="polite">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setFile(null);
                setError(null);
                resetInput();
              }}
              disabled={isLoading} // ← evitar cerrar mientras carga
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700"
              disabled={!file || !!error || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando…
                </>
              ) : (
                'Importar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ImportButton;
