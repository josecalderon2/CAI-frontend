import { api } from '../axiosConfig';

// DTO para actualización del perfil
interface UpdatePerfilDto {
  nombre?: string;
  apellido?: string;
  password?: string;
  currentPassword?: string; // Contraseña actual requerida para cambiar la contraseña
  telefono?: string;
  direccion?: string;
}

// DTO para respuesta del perfil
export interface UserProfile {
  id_administrativo?: number;
  id_orientador?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  dui?: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
  cargoAdministrativo?: {
    id_cargo_administrativo?: number;
    nombre: string;
  };
}

export const perfilService = {
  // Obtener perfil del usuario autenticado según su rol
  getPerfilUsuario: async (role: string): Promise<UserProfile> => {
    try {
      // Ahora todos los roles pueden acceder a sus propios perfiles por ID
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('userData en localStorage:', userData);

      let userId, endpoint;

      if (role === 'Orientador' || role === 'orientador') {
        userId = userData.id || userData.id_orientador || userData.sub;

        if (!userId) {
          throw new Error('No se pudo determinar el ID del orientador');
        }

        endpoint = `/orientador/${userId}`;
      } else if (
        role === 'Admin' ||
        role === 'admin' ||
        role === 'P.A' ||
        role === 'administrativo'
      ) {
        userId = userData.id || userData.id_administrativo || userData.sub;

        if (!userId) {
          throw new Error('No se pudo determinar el ID del administrativo');
        }

        endpoint = `/administrativo/${userId}`;
      } else {
        throw new Error('Rol no soportado para obtener perfil');
      }

      console.log(`Obteniendo perfil para ${role} desde endpoint: ${endpoint}`);
      const response = await api.get(endpoint);
      return response.data as UserProfile;
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
      throw error;
    }
  },

  // Ya no necesitamos esta función ya que el backend ahora valida la contraseña
  // La mantenemos por compatibilidad con el código existente, pero ahora siempre retorna true
  validatePassword: async (
    _role: string,
    currentPassword: string
  ): Promise<boolean> => {
    // Verificamos que la contraseña no esté vacía
    return !!currentPassword.trim();
  },

  // Actualizar perfil del usuario autenticado según su rol
  updatePerfil: async (role: string, data: UpdatePerfilDto) => {
    try {
      // El endpoint depende del rol del usuario
      let endpoint = '';

      if (role === 'Orientador' || role === 'orientador') {
        endpoint = '/orientador/profile';
      } else if (
        role === 'Admin' ||
        role === 'admin' ||
        role === 'P.A' ||
        role === 'administrativo'
      ) {
        endpoint = '/administrativo/profile';
      } else {
        throw new Error('Rol no soportado para actualizar perfil');
      }

      console.log(
        `Actualizando perfil para rol ${role} en endpoint ${endpoint}`,
        data
      );
      const response = await api.patch(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      throw error;
    }
  },
};
