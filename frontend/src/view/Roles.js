import { useEffect, useState } from 'react';
import axios from 'axios';

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

    const obtenerRol = () => {
      axios.get('http://localhost:3100/api/roles/listar?page=${page}&limit=${limite}').then((res)=>{
        setRol(res.data.rol || []);
        setTotalPaginas(res.data.totalPages || 1);
        setPaginaActual(res.data.currentPage || 1);
      }).catch((error)=>{
        console.error("Error al mostrar Rol: ",error);
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
          <h2 className="text-center mb-4">Roles</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button className='btn btn-primary mb-3' 
          onClick={()=> setMostrarAgregar(true)}>Agregar Roles</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad' 
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button className="btn btn-outline-secondary" onClick={buscarRol}>Buscar</button>
              <button className="btn btn-outline-secondary" onClick={obtenerRol}>resetear</button>
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
                  <td><button className="btn btn-success" onClick={()=>{ 
                    setRolselecionado(roles);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button className="btn btn-danger" onClick={()=>{ 
                    setRolselecionado(roles.id_rol);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button 
              className="btn btn-outline-primary" 
              disabled={paginaActual === 1} 
              onClick={() => {
                const paginaAnterior = paginaActual - 1;
                obtenerRol(paginaAnterior);
              }}
            >
              Anterior
            </button>
            
            <span className="fw-bold">
              Página {paginaActual} de {totalPaginas}
            </span>
            
            <button 
              className="btn btn-outline-primary" 
              disabled={paginaActual === totalPaginas} 
              onClick={() => {
                const paginaSiguiente = paginaActual + 1;
                obtenerRol(paginaSiguiente);
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/*modal de agregar*/}
      {mostrarAgregar && (
        <div style={{
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
        }}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Agregar Nuevo Rol </h5>
                  <button className="btn-close" onClick={()=> setMostrarAgregar(false)}></button>
                </div>
                <div className="modal-body">
                  <Agregar cerrarmodal={cerrarModal}/>
                </div>
              </div>
            </div>
          </div>  
        </div>
      )}
      {/*modales de editar*/}
      {mostrarEditar && (
        <div style={{
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
        }}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Editar un Rol</h5>
                  <button className="btn-close" onClick={()=> setMostrarEditar(false)}></button>
                </div>
                <div className="modal-body">
                  <Editar cerrarmodal={cerrarModal} datos={Rolselecionado}/>
                </div>
              </div>
            </div>
          </div>  
        </div>
      )}
      {/*modal de eliminar*/}
      {mostrarEliminar && (
        <div style={{
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
        }}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Eliminar a un Rol </h5>
                  <button className="btn-close" onClick={()=> setmostrarEliminar(false)}></button>
                </div>
                <div className="modal-body">
                  <Eliminar id={Rolselecionado} cerrarmodal={cerrarModal}/>
                </div>
              </div>
            </div>
          </div>  
        </div>
      )}
    </div>
  );
}

function Agregar({cerrarmodal}){

  const [Rol, setRol] = useState("");

  const add = (event) =>{
    event.preventDefault();

    axios.post("http://localhost:3100/api/roles/agregar",{
      rol: Rol
    })
    .then(()=>{
      cerrarmodal();
      alert("reguistro Exitoso");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Rol</label>
        <input className="form-control" onChange={(event) => {setRol(event.target.value);}} type='text'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={add}>Agregar</button>
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

    axios.put(`http://localhost:3100/api/roles/actualizar/${datos.id_rol}`,{
      id_rol: Id_rol,
      rol: Rol
    }).then(()=>{
      cerrarmodal();
      alert("Rol actualizado correctamente");
    });
  };
  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Id Rol</label>
        <input className="form-control" value={Id_rol} onChange={(event) => {setId_rol(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Rol</label>
        <input className="form-control" value={Rol} onChange={(event) => {setRol(event.target.value);}} type='text'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Rol = ()=>{
    if(window.confirm("¿seguro que quieres eliminar este Rol?")){
      axios.delete(`http://localhost:3100/api/roles/eliminar/${id}`).then(()=>{
        alert("Rol eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        alert("el Rol no fue eliminado");
        cerrarmodal();
      });
    }
  };

  return(
    <div>
      <h5>seguro que quieres eliminar este Rol</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Rol}>eliminar</button>
    </div>
  )
}

export default Roles;