import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import AsignarTecnico from './AsignarTecnico';
import { AgregarEntradaRepuesto } from './EntradaRepuestos';
import { AgregarHistorial } from './Historial';
import InactividadTimer from '../components/InactividadTimer';

function Dashboard() {

  const rol = Number(localStorage.getItem("rol"));

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
    zIndex: 1000
  };

  const estiloBotonFlotante = (bottom) => ({
    position: 'fixed',
    bottom,
    right: '30px',
    borderRadius: '50px',
    padding: '14px 24px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    zIndex: 1050
  });

  const estiloBotonDescarga = (bottom) => ({
    position: 'fixed',
    bottom,
    borderRadius: '50px',
    padding: '14px 24px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    zIndex: 1050
  });

  const cerrarSidebar = () => setSidebarAbierto(false);

  return (
    <div className="sigat-layout">
      <InactividadTimer />

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

      <a style={estiloBotonDescarga('30px')} href="/descargas/sigat.apk" download="sigat.apk" className="sigat-boton-descarga btn btn-primary">
        Descargar app móvil
      </a>

      {rol === 3 && (
        <button
          type="button"
          onClick={() => setMostrarNuevoServicio(true)}
          className="btn btn-primary sigat-boton-flotante"
          style={estiloBotonFlotante('30px')}
        >
          + Nuevo servicio
        </button>
      )}

      {(rol === 1 || rol === 16 || rol === 17) && (
        <button
          type="button"
          onClick={() => setMostrarAsignarTecnico(true)}
          className="btn btn-primary sigat-boton-flotante"
          style={estiloBotonFlotante('30px')}
        >
          + Asignar técnico
        </button>
      )}

      {(rol === 1 || rol === 16 || rol === 17) && (
        <button
          type="button"
          onClick={() => setMostrarRegistrarEntrada(true)}
          className="btn btn-success sigat-boton-flotante"
          style={estiloBotonFlotante('90px')}
        >
          + Registrar entrada
        </button>
      )}

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
  );
}

export default Dashboard;
