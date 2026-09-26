import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AsignarTecnico from './AsignarTecnico';
import { AgregarEntradaRepuesto } from './EntradaRepuestos';
import { AgregarHistorial } from './Historial';
import InactividadTimer from '../components/InactividadTimer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SesionContext, puedeEntrar } from '../components/Sesion';

function Dashboard() {

  const navigate = useNavigate();
  const location = useLocation();

  // El rol se toma del servidor, nunca del localStorage (ver components/Sesion.js).
  // null = todavía verificando; "error" = no se pudo verificar.
  const [sesion, setSesion] = useState(null);

  const cerrarSesion = useCallback(() => {
    localStorage.clear();
    navigate('/', { replace: true });
  }, [navigate]);

  const cargarSesion = useCallback(() => {
    if (!localStorage.getItem('token')) {
      cerrarSesion();
      return;
    }
    axios.get('/api/usuarios/mi-perfil').then((res) => {
      const u = res.data;
      setSesion({
        rol: Number(u.id_rol),
        nombre: u.nombre || '',
        numeroIdentidad: u.numero_identidad != null ? String(u.numero_identidad) : '',
      });
    }).catch((error) => {
      const estado = error.response?.status;
      // Token inválido, vencido o alterado: se cierra la sesión.
      if (estado === 401 || estado === 403 || estado === 404) {
        cerrarSesion();
      } else {
        setSesion('error');
      }
    });
  }, [cerrarSesion]);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  const [mostrarAsignarTecnico, setMostrarAsignarTecnico] = useState(false);
  const [mostrarRegistrarEntrada, setMostrarRegistrarEntrada] = useState(false);
  const [mostrarNuevoServicio, setMostrarNuevoServicio] = useState(false);
  // RNF: menú lateral responsivo. En móvil el sidebar se comporta como un
  // panel deslizante (off-canvas) que se abre con el botón hamburguesa de
  // la barra superior y se cierra tocando el fondo oscuro o un enlace.
  // En escritorio el sidebar sigue siendo fijo y visible (ver theme.css).
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const estiloModal = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // Por encima de la barra superior, el sidebar y la barra de botones
    // fijos en móvil (.sigat-topbar 1040, .sigat-sidebar-backdrop 1045,
    // .sigat-sidebar y .sigat-barra-acciones 1050 en theme.css), para que
    // el modal siempre se vea completo y no quede tapado por ellos.
    zIndex: 1100
  };

  // Todos los botones de acción (Descargar app, Nuevo servicio, Asignar
  // técnico, Registrar entrada) van en una sola fila fija abajo a la
  // izquierda (ver .sigat-barra-acciones en theme.css), como en el boceto
  // que mandaste: una sola línea horizontal, dejando libre la esquina
  // inferior derecha donde Netlify pone su aviso "Powered by Netlify".
  const estiloBotonAccion = {
    borderRadius: '50px',
    padding: '14px 24px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
  };

  const cerrarSidebar = () => setSidebarAbierto(false);

  if (sesion === null) {
    return <div className="container mt-5"><p>Verificando tu sesión...</p></div>;
  }

  if (sesion === 'error') {
    return (
      <div className="container mt-5">
        <p>No se pudo verificar tu sesión. Revisa tu conexión e intenta de nuevo.</p>
        <button type="button" className="btn btn-primary me-2" onClick={() => { setSesion(null); cargarSesion(); }}>Reintentar</button>
        <button type="button" className="btn btn-outline-secondary" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    );
  }

  const rol = sesion.rol;

  // Entrar por dirección a una sección de otro rol devuelve al inicio del panel.
  if (!puedeEntrar(location.pathname, rol)) {
    return <Navigate to="/panel" replace />;
  }

  return (
    <SesionContext.Provider value={{ ...sesion, recargarSesion: cargarSesion }}>
    <div className="sigat-layout">
      <InactividadTimer />

      {/* Un solo contenedor de avisos para todo el panel. Antes cada vista
          tenía el suyo, y los formularios que se abren desde los botones
          fijos (Nuevo servicio, Registrar entrada, Asignar técnico) no
          mostraban el aviso cuando la página actual no tenía contenedor. */}
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="sigat-topbar">
        <button
          type="button"
          className="sigat-topbar-toggle"
          aria-label="Abrir menú"
          onClick={() => setSidebarAbierto((abierto) => !abierto)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span className="sigat-topbar-title">Sigat</span>
      </header>

      {sidebarAbierto && <div className="sigat-sidebar-backdrop" onClick={cerrarSidebar}></div>}

      <nav className={`sigat-sidebar${sidebarAbierto ? ' sigat-sidebar-abierto' : ''}`}>
        <h2>Panel</h2>
        <ul className='nav flex-column mt2'>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>inicio</Link></li>
          {(rol === 1 || rol === 16 || rol === 17) && ( <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/usuarios" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>usuarios</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/tecnico" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>tecnico</Link></li>)}
          { rol === 17 && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/roles" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>roles</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/distribuidores" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>distribuidores</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/entradaRepuestos" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>entrada de repuestos</Link></li>)}
          {(rol === 1 || rol === 16 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/repuesto" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>repuesto</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/auditoria" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>Auditoria</Link></li>)}
          {(rol === 1 || rol === 3 || rol === 16 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/motos" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>motos</Link></li>)}
          {(rol === 1 || rol === 2 || rol === 3 || rol === 16 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/historial" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>Servicio</Link></li>)}
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/mi-perfil" className='nav-link text-black px-0 py-2' onClick={cerrarSidebar}>mi perfil</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/" className='nav-link text-black px-0 py-2' onClick={() => { localStorage.clear(); cerrarSidebar(); }}>Cerrar Sesión</Link></li>
        </ul>
      </nav>

      <main className="sigat-main">
        <Outlet />
      </main>

      <div className="sigat-barra-acciones">
        <a style={estiloBotonAccion} href="/descargas/sigat.apk" download="sigat.apk" className="btn btn-primary">
          Descargar app móvil
        </a>

        {rol === 3 && (
          <button
            type="button"
            onClick={() => setMostrarNuevoServicio(true)}
            className="btn btn-primary"
            style={estiloBotonAccion}
          >
            + Nuevo servicio
          </button>
        )}

        {(rol === 1 || rol === 16 || rol === 17) && (
          <button
            type="button"
            onClick={() => setMostrarAsignarTecnico(true)}
            className="btn btn-primary"
            style={estiloBotonAccion}
          >
            + Asignar técnico
          </button>
        )}

        {(rol === 1 || rol === 16 || rol === 17) && (
          <button
            type="button"
            onClick={() => setMostrarRegistrarEntrada(true)}
            className="btn btn-success"
            style={estiloBotonAccion}
          >
            + Registrar entrada
          </button>
        )}
      </div>

      {mostrarAsignarTecnico && (
        <div style={estiloModal}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Asignar técnico</h5>
                  <button type="button" className="btn-close" onClick={() => setMostrarAsignarTecnico(false)}></button>
                </div>
                <div className="modal-body">
                  <AsignarTecnico />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarRegistrarEntrada && (
        <div style={estiloModal}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Registrar entrada de repuestos</h5>
                  <button type="button" className="btn-close" onClick={() => setMostrarRegistrarEntrada(false)}></button>
                </div>
                <div className="modal-body">
                  <AgregarEntradaRepuesto cerrarmodal={() => setMostrarRegistrarEntrada(false)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {mostrarNuevoServicio && (
        <div style={estiloModal}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Nuevo servicio</h5>
                  <button type="button" className="btn-close" onClick={() => setMostrarNuevoServicio(false)}></button>
                </div>
                <div className="modal-body">
                  <AgregarHistorial cerrarmodal={() => setMostrarNuevoServicio(false)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </SesionContext.Provider>
  );
}

export default Dashboard;
