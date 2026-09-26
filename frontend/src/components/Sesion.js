import { createContext, useContext } from 'react';

// Sesión del usuario autenticado.
//
// El rol, el nombre y el número de identidad NO se leen del localStorage:
// cualquiera puede cambiarlos desde las herramientas del navegador. Dashboard.js
// los pide al servidor (GET /api/usuarios/mi-perfil) con el token firmado y los
// comparte con todas las vistas del panel a través de este contexto. En el
// localStorage solo queda el token, que el servidor valida en cada petición.
export const SesionContext = createContext({
  rol: 0,
  nombre: '',
  numeroIdentidad: '',
  recargarSesion: () => {},
});

export const useSesion = () => useContext(SesionContext);

// Roles que pueden entrar a cada sección del panel. Es la misma regla del menú
// lateral: si alguien escribe la dirección a mano sin tener el rol, se le
// devuelve al inicio del panel.
export const PERMISOS_RUTAS = {
  '/panel/usuarios': [1, 16, 17],
  '/panel/tecnico': [1, 17],
  '/panel/roles': [17],
  '/panel/distribuidores': [1, 17],
  '/panel/entradaRepuestos': [1, 17],
  '/panel/repuesto': [1, 16, 17],
  '/panel/auditoria': [1, 17],
  '/panel/motos': [1, 3, 16, 17],
  '/panel/historial': [1, 2, 3, 16, 17],
};

export function puedeEntrar(ruta, rol) {
  const permitidos = PERMISOS_RUTAS[ruta.replace(/\/+$/, '')];
  return !permitidos || permitidos.includes(rol);
}
