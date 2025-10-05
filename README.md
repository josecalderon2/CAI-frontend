# Colegio Amigos de Israel - Frontend

Este proyecto contiene el frontend para el sistema de gestión escolar del Colegio Amigos de Israel.

## Tecnologías utilizadas

- React 19
- TypeScript
- Vite 7
- TailwindCSS 4
- React Router 7
- Radix UI

## Requisitos

- Node.js versión 20.19+ o 22.12+
- npm o yarn

## Configuración del entorno

El proyecto utiliza variables de entorno para configurar la URL de la API:

- Desarrollo: `.env` - Apunta a `http://localhost:3000`
- Producción: `.env.production` - Apunta a la URL de la API en producción

## Comandos disponibles

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Construir específicamente para producción
npm run build:prod

# Vista previa de la construcción
npm run preview
```

## Despliegue en VM local con Windows

### Preparación del servidor IIS

1. Asegúrate de tener instalado IIS en la VM Windows
2. Instala el módulo URL Rewrite para IIS (necesario para SPAs):
   - Descarga desde: https://www.iis.net/downloads/microsoft/url-rewrite
   - Instala siguiendo las instrucciones del instalador

### Despliegue de la aplicación

1. Ejecuta `npm run build` para generar la carpeta `dist`
2. Copia todo el contenido de la carpeta `dist` a la carpeta del sitio web en IIS
   (por ejemplo: `C:\inetpub\wwwroot\cai` o la ruta que hayas configurado)
3. Asegúrate de que el archivo `web.config` esté presente en la raíz del sitio
4. En el Administrador de IIS:
   - Crea un nuevo sitio web o aplicación
   - Configura la ruta física al directorio donde copiaste los archivos
   - Asigna un nombre de host según sea necesario para tu red local

## Notas adicionales

- Asegúrate de que la API de backend esté correctamente configurada y accesible desde la VM local
- Verifica que las redirecciones funcionan correctamente para rutas profundas
- Comprueba que los archivos estáticos (imágenes, etc.) se cargan correctamente
- Si tienes problemas con las redirecciones, verifica que el módulo URL Rewrite está instalado y funcionando
- Para acceso desde otras máquinas en la red local, asegúrate de configurar correctamente las reglas de firewall de Windows
- Considera configurar HTTPS incluso para redes locales para mayor seguridad
