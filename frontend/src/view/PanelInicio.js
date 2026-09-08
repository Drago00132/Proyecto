import { Link } from 'react-router-dom';

// RF: pantalla de inicio del panel. Antes /panel no tenía una ruta índice,
// así que el <Outlet/> del Dashboard quedaba en blanco al entrar. Aquí se
// saluda al usuario con su nombre (guardado en localStorage al iniciar
// sesión, ver login.js) y se muestran accesos rápidos a las secciones
// según su rol, con la misma lógica de permisos que ya usa el menú lateral
// (Dashboard.js).
const NOMBRES_ROLES = { 1: "Administrador", 2: "Técnico", 3: "Cliente", 16: "Recepcionista", 17: "Super Administrador" };

function PanelInicio() {
  const rol = Number(localStorage.getItem("rol"));
  const nombre = localStorage.getItem("nombre") || "";

  const opciones = [
    { to: "/panel/usuarios", titulo: "Usuarios", descripcion: "Gestionar las cuentas del sistema", permitido: rol === 1 || rol === 16 || rol === 17 },
    { to: "/panel/tecnico", titulo: "Técnicos", descripcion: "Consultar y editar técnicos", permitido: rol === 1 || rol === 17 },
    { to: "/panel/roles", titulo: "Roles", descripcion: "Administrar los roles del sistema", permitido: rol === 17 },
    { to: "/panel/distribuidores", titulo: "Distribuidores", descripcion: "Gestionar distribuidores y sus repuestos", permitido: rol === 1 || rol === 17 },
    { to: "/panel/entradaRepuestos", titulo: "Entrada de repuestos", descripcion: "Registrar entradas de inventario", permitido: rol === 1 || rol === 17 },
    { to: "/panel/repuesto", titulo: "Repuestos", descripcion: "Consultar el inventario de repuestos", permitido: rol === 1 || rol === 16 || rol === 17 },
    { to: "/panel/auditoria", titulo: "Auditoría", descripcion: "Historial de cambios sobre repuestos", permitido: rol === 1 || rol === 17 },
    { to: "/panel/motos", titulo: "Motos", descripcion: "Consultar las motos registradas", permitido: rol === 1 || rol === 3 || rol === 16 || rol === 17 },
    { to: "/panel/historial", titulo: "Servicio", descripcion: "Historial de servicios y reparaciones", permitido: rol === 1 || rol === 2 || rol === 3 || rol === 16 || rol === 17 },
    { to: "/panel/mi-perfil", titulo: "Mi perfil", descripcion: "Ver y editar tu información", permitido: true },
  ].filter((opcion) => opcion.permitido);

  return (
    <div className="App">
      <div className="container mt-5">
        <div className="card p-4">
          <h2 className="mb-1">Bienvenido{nombre ? `, ${nombre}` : ""}</h2>
          <p className="text-muted mb-4">
            {NOMBRES_ROLES[rol] ? `Sesión iniciada como ${NOMBRES_ROLES[rol]}.` : "Selecciona una opción para comenzar."}
          </p>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
            {opciones.map((opcion) => (
              <div className="col" key={opcion.to}>
                <Link to={opcion.to} className="card h-100 text-decoration-none sigat-card-opcion">
                  <div className="card-body">
                    <h5 className="card-title text-primary">{opcion.titulo}</h5>
                    <p className="card-text text-muted mb-0">{opcion.descripcion}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PanelInicio;
