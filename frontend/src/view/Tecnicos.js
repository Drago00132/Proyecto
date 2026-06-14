import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Tecnicos() {
  const [Tecnico, setTecnico] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [TecnicoSelecionado, setTecnicoSelecionado] = useState(null);
  //paginador 
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarTecnico = () =>{
    axios.get(`http://localhost:3100/api/tecnico/consultar/${busqueda}`)
    .then((res) => {
      setTecnico(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerTecnicos = () => {
      axios.get(`http://localhost:3100/api/tecnico/listar?page=${paginaActual}&limit=${limite}`).then((res)=>{
        setTecnico(res.data.tecnico || []);
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
      obtenerTecnicos(paginaActual);
    };

    useEffect(()=>{
      obtenerTecnicos();
    },[paginaActual]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <ToastContainer position="top-right" autoClose={3000} />
          <h2 className="text-center mb-4">Tecnicos</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button className='btn btn-primary mb-3' 
          onClick={()=> setMostrarAgregar(true)}>subir Tecnico</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad' 
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button className="btn btn-outline-secondary" onClick={buscarTecnico}>Buscar</button>
              <button className="btn btn-outline-secondary" onClick={obtenerTecnicos}>resetear</button>
            </div>
          </div>

          {/* tabal de Roles*/}

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Id del Tecnico</th>
                <th scope="col">Numero de identidad</th>
                <th scope="col">Nombre y apellido</th>
                <th scope="col">Reparaciones asignadas</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Tecnico.map((tecnicos, index) => (
                <tr key={index}> 
                  <td>{tecnicos.id_tecnico}</td>
                  <td>{tecnicos.numero_identidad}</td>
                  <td>{tecnicos.nombre}, {tecnicos.apellido}</td>
                  <td>{tecnicos.reparaciones_asignadas}</td>
                  <td><button className="btn btn-success" onClick={()=>{ 
                    setTecnicoSelecionado(tecnicos);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button className="btn btn-danger" onClick={()=>{ 
                    setTecnicoSelecionado(tecnicos.id_tecnico);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button className="btn btn-outline-primary" disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button>
            
            <span className="fw-bold">Página {paginaActual} de {totalPaginas}</span>
            
            <button className="btn btn-outline-primary" disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button>
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
                  <h5 className="modal-title">Agregar Nuevo Tecnico </h5>
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
                  <h5 className="modal-title">Editar un Tecnico</h5>
                  <button className="btn-close" onClick={()=> setMostrarEditar(false)}></button>
                </div>
                <div className="modal-body">
                  <Editar cerrarmodal={cerrarModal} datos={TecnicoSelecionado}/>
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
                  <h5 className="modal-title">Eliminar a un Tecnico </h5>
                  <button className="btn-close" onClick={()=> setmostrarEliminar(false)}></button>
                </div>
                <div className="modal-body">
                  <Eliminar id={TecnicoSelecionado} cerrarmodal={cerrarModal}/>
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
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);

const subirArchivo = async () => {
  if (!archivo) return toast.error("Por favor selecciona un archivo primero");

  const formData = new FormData();
  formData.append('archivo', archivo);

  try {
    await axios.post('http://localhost:3100/api/usuarios/cargar-masiva', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    toast.success("Carga masiva exitosa");
    
    cerrarmodal(false); 
    
  } catch (error) {
    toast.error("Error al subir el archivo: " + error.message);
  }
};

  return (
  <div className="mb-3">
    <label className="btn btn-outline-primary w-100">
      {archivo ? archivo.name : "Seleccionar archivo Excel"}
      <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => setArchivo(e.target.files[0])} />
    </label>
    <button className="btn btn-success w-100 mt-3" onClick={subirArchivo} disabled={!archivo} >{cargando ? "Procesando..." : "Subir Técnicos"}</button>
  </div>
  )
}

function Editar({datos,cerrarmodal}){

  const [Id_tecnico , setId_tecnico ] = useState("");
  const [Numero_identidad , setNumero_identidad ] = useState("");
  const [Reparaciones_asignadas	, setReparaciones_asignadas] = useState("");

  useEffect (()=>{
    if(datos){
      setId_tecnico(datos.id_tecnico || "");
      setNumero_identidad(datos.numero_identidad || "");
      setReparaciones_asignadas(datos.reparaciones_asignadas || "");
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    if (Numero_identidad.trim() === "" || Reparaciones_asignadas.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.put(`http://localhost:3100/api/tecnico/actualizar/${datos.id_tecnico}`,{
      id_tecnico:Id_tecnico,
      numero_identidad:Numero_identidad,
      reparaciones_asignadas:Reparaciones_asignadas
    }).then(()=>{
      cerrarmodal();
      toast.success("Tecnico actualizado correctamente");
    });
  };
  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Id del tecnico</label>
        <input className="form-control" value={Id_tecnico} onChange={(event) => {setId_tecnico(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Numero de identidad</label>
        <input className="form-control" value={Numero_identidad} onChange={(event) => {setNumero_identidad(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Reparaciones asignadas</label>
        <input className="form-control" value={Reparaciones_asignadas} onChange={(event) => {setReparaciones_asignadas(event.target.value);}} type='text'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Tecnico = ()=>{
    if(window.confirm("¿seguro que quieres eliminar a este Tecnico?")){
      axios.delete(`http://localhost:3100/api/tecnico/eliminar/${id}`).then(()=>{
        toast.success("Tecnico eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        toast.error("el Tecnico no fue eliminado");
        cerrarmodal();
      });
    }
  };

  return(
    <div>
      <h5>seguro que quieres eliminar este Tecnico</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Tecnico}>eliminar</button>
    </div>
  )
}

export default Tecnicos;