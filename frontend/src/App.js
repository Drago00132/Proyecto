import { BrowserRouter as Router, Routes, Route } 
from 'react-router-dom';
import Dashboard from './view/Dashboard'
import Login from './view/login'
import Usuarios from './view/Usuarios'
import Tecnico from './view/Tecnicos'
import Roles from './view/Roles'
import Repuesto from './view/Repuesto'
import Motos from './view/Motos'
import Historial from './view/Historial'
import Registrarse from './view/registar'
import Distribuidores from './view/Distribuidores'
import EntradaRepuestos from './view/EntradaRepuestos';
import RecuperarContrasena from './view/RecuperarContrasena';
import RestablecerContrasena from './view/RestablecerContrasena';
import MiPerfil from './view/MiPerfil';
import AsignarTecnico from './view/AsignarTecnico';

function App() {

  return (
    <Router>
      <Routes>
           <Route path="/" element={<Login/>}></Route>
           <Route path='/Registarse' element={<Registrarse/>}></Route>
           <Route path='/recuperar-contrasena' element={<RecuperarContrasena/>}></Route>
           <Route path='/restablecer-contrasena' element={<RestablecerContrasena/>}></Route>
           <Route path="/panel" element={<Dashboard/>}>
            <Route path='/panel/mi-perfil' element={<MiPerfil/>}></Route>
            <Route path='/panel/usuarios' element={<Usuarios/>}></Route>
            <Route path='/panel/tecnico' element={<Tecnico/>}></Route>
            <Route path='/panel/roles' element={<Roles/>}></Route>
            <Route path='/panel/repuesto' element={<Repuesto/>}></Route>
            <Route path='/panel/motos' element={<Motos/>}></Route>
            <Route path='/panel/distribuidores' element={<Distribuidores/>}></Route>
            <Route path='/panel/entradaRepuestos' element={<EntradaRepuestos/>}></Route>
            <Route path='/panel/historial' element={<Historial/>}></Route>
           </Route>
      </Routes>
    </Router>  
  
  );
}

export default App;