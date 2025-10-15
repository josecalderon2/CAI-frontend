/**
 * Formatea una fecha en formato ISO o string a un formato más legible
 * @param dateString Fecha en formato ISO o string
 * @param format Formato deseado: 'short', 'medium', 'long'
 * @returns Fecha formateada
 */
export function formatDate(
  dateString: string | Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!dateString) return '-';

  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    switch (format) {
      case 'short':
        // Formato: 15/01/2025
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      case 'long':
        // Formato: 15 de enero de 2025
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'medium':
      default:
        // Formato: 15 ene 2025
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
    }
  } catch (e) {
    console.error('Error al formatear fecha:', e);
    return 'Error de formato';
  }
}
