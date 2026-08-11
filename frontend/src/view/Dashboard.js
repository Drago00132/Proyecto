import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import AsignarTecnico from './AsignarTecnico';
import { AgregarEntradaRepuesto } from './EntradaRepuestos';

function Dashboard() {

  const rol = Number(localStorage.getItem("rol"));
  const navigate = useNavigate();

  const [mostrarAsignarTecnico, setMostrarAsignarTecnico] = useState(false);
  const [mostrarRegistrarEntrada, setMostrarRegistrarEntrada] = useState(false);

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

  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: '220px', background: '#f4f4f4', height: '100vh', padding: '15px' }}>
        <h2>Panel</h2>
        <ul className='nav flex-column mt2'>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel" className='nav-link text-black px-0 py-2' >inicio</Link></li>
          {(rol === 1 || rol === 16 || rol === 17) && ( <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/usuarios" className='nav-link text-black px-0 py-2'>usuarios</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/tecnico" className='nav-link text-black px-0 py-2'>tecnico</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/roles" className='nav-link text-black px-0 py-2'>roles</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/distribuidores" className='nav-link text-black px-0 py-2'>distribuidores</Link></li>)}
          {(rol === 1 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/entradaRepuestos" className='nav-link text-black px-0 py-2'>entrada de repuestos</Link></li>)}
          {(rol === 1 || rol === 16 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/repuesto" className='nav-link text-black px-0 py-2'>repuesto</Link></li>)}
          {(rol === 1 || rol === 3 || rol === 16 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/motos" className='nav-link text-black px-0 py-2'>motos</Link></li>)}
          {(rol === 1 || rol === 2 || rol === 3 || rol === 16 || rol === 17) && (<li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/historial" className='nav-link text-black px-0 py-2'>historial</Link></li>)}
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/mi-perfil" className='nav-link text-black px-0 py-2'>mi perfil</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/" className='nav-link text-black px-0 py-2' onClick={() => localStorage.clear()}>Cerrar Sesión</Link></li>
        </ul>
      </nav>

      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>

      {rol === 3 && (
        <button
          onClick={() => navigate('/panel/historial?nuevo=1')}
          className="btn btn-primary"
          style={estiloBotonFlotante('30px')}
        >
          + Nuevo servicio
        </button>
      )}

      {(rol === 1 || rol === 16 || rol === 17) && (
        <button
          onClick={() => setMostrarAsignarTecnico(true)}
          className="btn btn-primary"
          style={estiloBotonFlotante('30px')}
        >
          + Asignar técnico
        </button>
      )}

      {(rol === 1 || rol === 16 || rol === 17) && (
        <button
          onClick={() => setMostrarRegistrarEntrada(true)}
          className="btn btn-success"
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
                  <button className="btn-close" onClick={() => setMostrarAsignarTecnico(false)}></button>
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
                  <button className="btn-close" onClick={() => setMostrarRegistrarEntrada(false)}></button>
                </div>
                <div className="modal-body">
                  <AgregarEntradaRepuesto cerrarmodal={() => setMostrarRegistrarEntrada(false)} />
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