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
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ImportButtonProps {
  /** Callback invoked when the user confirms import with a valid file */
  onImport: (file: File) => Promise<any> | void;
  /** Label for the trigger button */
  triggerLabel?: string;
  /** Maximum allowed file size in bytes (default 10MB) */
  maxSizeBytes?: number;
  /** Accepted file extensions (input accept attribute) */
  accept?: string;
}

/**
 * ImportButton
 * Reusable component that opens a Dialog to select an Excel/CSV file and
 * calls the provided `onImport` callback with the selected File.
 *
 * Usage:
 * <ImportButton onImport={async (file) => await importMatricula(file)} />
 */
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

  const validateFile = (f: File) => {
    if (!f) return 'Archivo inválido';
    const allowed = /\.(xls|xlsx|csv)$/i.test(f.name);
    if (!allowed) return 'Tipo de archivo no válido. Use .xls, .xlsx o .csv';
    if (f.size > maxSizeBytes)
      return `Archivo demasiado grande (máx. ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`;
    return null;
  };

  const handleSelectClick = () => {
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

    try {
      setIsLoading(true);
      const loadingToast = toast.loading('Importando...');
      const result = await onImport(file);
      toast.dismiss(loadingToast);
      toast.success('Importación completada');
      setOpen(false);
      setFile(null);
      setError(null);
      return result;
    } catch (err: any) {
      toast.error(err?.message || 'Error durante la importación');
      setError(err?.message || 'Error durante la importación');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileText className="w-4 h-4 mr-2" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Matrícula</DialogTitle>
            <DialogDescription>
              Selecciona un archivo Excel o CSV que contenga la hoja "Alumnos".
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
              <Button onClick={handleSelectClick} variant="outline">
                Seleccionar archivo
              </Button>
              <div className="mt-2 sm:mt-0">
                {file ? (
                  <p className="text-sm text-gray-700">
                    Archivo seleccionado:{' '}
                    <span className="font-medium">{file.name}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Ningún archivo seleccionado
                  </p>
                )}
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
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
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700"
              disabled={!file || !!error || isLoading}
            >
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ImportButton;
