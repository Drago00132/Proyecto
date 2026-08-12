import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalOverlay from '../components/ModalOverlay';
import Paginador from '../components/Paginador';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import eliminarRecurso from '../utils/eliminarRecurso';

function Roles() {
  const [Rol, setRol] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [Rolselecionado, setRolselecionado] = useState(null);
  //paginador
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarRol = () =>{
    axios.get(`http://localhost:3100/api/roles/consultar/${busqueda}`)
    .then((res) => {
      setRol(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerRol = (page = 1) => {
      axios.get(`http://localhost:3100/api/roles/listar?page=${page}&limit=${limite}`).then((res)=>{
        setRol(res.data.rol || []);
        setTotalPaginas(res.data.totalPages || 1);
        setPaginaActual(res.data.currentPage || 1);
      }).catch((error)=>{
        console.error("Error al mostrar Rol: ",error);
        toast.error("No se pudo cargar el listado de roles");
      });
    };

    const cerrarModal =()=>{
      setMostrarAgregar(false);
      setMostrarEditar(false);
      setmostrarEliminar(false);
      obtenerRol(paginaActual);
    };

    useEffect(()=>{
      obtenerRol();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5">
        <div className="card p-4">
          <ToastContainer position="top-right" autoClose={3000} />
          <h2 className="text-center mb-4">Roles</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button type="button" className='btn btn-primary mb-3'
          onClick={()=> setMostrarAgregar(true)}>Agregar Roles</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad'
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button type="button" className="btn btn-outline-secondary" onClick={buscarRol}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerRol}>resetear</button>
            </div>
          </div>

          {/* tabal de Roles*/}

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Id del Rol</th>
                <th scope="col">Rol</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Rol.map((roles, index) => (
                <tr key={index}>
                  <td>{roles.id_rol}</td>
                  <td>{roles.rol}</td>
                  <td><button type="button" className="btn btn-success" onClick={()=>{
                    setRolselecionado(roles);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button type="button" className="btn btn-danger" onClick={()=>{
                    setRolselecionado(roles.id_rol);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={obtenerRol} />
        </div>
      </div>

      {mostrarAgregar && (
        <ModalOverlay titulo="Agregar Nuevo Rol" onClose={()=> setMostrarAgregar(false)}>
          <Agregar cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
      {mostrarEditar && (
        <ModalOverlay titulo="Editar un Rol" onClose={()=> setMostrarEditar(false)}>
          <Editar cerrarmodal={cerrarModal} datos={Rolselecionado}/>
        </ModalOverlay>
      )}
      {mostrarEliminar && (
        <ModalOverlay titulo="Eliminar a un Rol" onClose={()=> setmostrarEliminar(false)}>
          <Eliminar id={Rolselecionado} cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
    </div>
  );
}

function Agregar({cerrarmodal}){

  const [Rol, setRol] = useState("");

  const add = (event) =>{
    event.preventDefault();

    if (Rol.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.post("http://localhost:3100/api/roles/agregar",{
      rol: Rol
    })
    .then(()=>{
      cerrarmodal();
      toast.success("reguistro Exitoso");
    })
    .catch((error)=>{
      console.error("Error al agregar rol: ", error);
      toast.error(error.response?.data?.message || "No se pudo registrar el rol");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="rol-agregar-nombre">Rol</label>
        <input id="rol-agregar-nombre" className="form-control" onChange={(event) => {setRol(event.target.value);}} type='text'></input>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({datos,cerrarmodal}){

  const [Id_rol, setId_rol] = useState("");
  const [Rol, setRol] = useState("");

  useEffect (()=>{
    if(datos){
      setId_rol(datos.id_rol || "");
      setRol(datos.rol || "");
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    if (Rol.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.put(`http://localhost:3100/api/roles/actualizar/${datos.id_rol}`,{
      id_rol: Id_rol,
      rol: Rol
    }).then(()=>{
      cerrarmodal();
      toast.success("Rol actualizado correctamente");
    }).catch((error)=>{
      console.error("Error al actualizar rol: ", error);
      toast.error(error.response?.data?.message || "No se pudo actualizar el rol");
    });
  };
  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="rol-editar-id">Id Rol</label>
        <input id="rol-editar-id" className="form-control" value={Id_rol} onChange={(event) => {setId_rol(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="rol-editar-nombre">Rol</label>
        <input id="rol-editar-nombre" className="form-control" value={Rol} onChange={(event) => {setRol(event.target.value);}} type='text'></input>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Rol = ()=>{
    eliminarRecurso({
      url: `http://localhost:3100/api/roles/eliminar/${id}`,
      mensajeExito: "Rol eliminado",
      mensajeError: "el Rol no fue eliminado",
      cerrarmodal
    });
  }

  return <ConfirmarEliminar mensaje="seguro que quieres eliminar este Rol" onConfirmar={eliminar_Rol} />;
}

export default Roles;
