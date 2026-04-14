import { Link, Outlet } from 'react-router-dom';

function Dashboard() {
  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: '250px', background: '#f4f4f4', height: '100vh', padding: '20px' }}>
        <h2>Panel</h2>
        <ul className='nav flex-column mt2'>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/usuarios" className='nav-link text-black px-0 py-2'>usuarios</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/tecnico" className='nav-link text-black px-0 py-2'>tecnico</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/roles" className='nav-link text-black px-0 py-2'>roles</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/repuesto" className='nav-link text-black px-0 py-2'>repuesto</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/motos" className='nav-link text-black px-0 py-2'>motos</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/panel/historial" className='nav-link text-black px-0 py-2'>historial</Link></li>
          <li className='nav-item border-bottom border-secundary border-opacity-25'><Link to="/" className='nav-link text-black px-0 py-2'>Cerrar Sesión</Link></li>
        </ul>
      </nav>

      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;