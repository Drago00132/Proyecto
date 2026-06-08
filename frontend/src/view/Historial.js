import { useEffect, useState } from 'react';
import axios from 'axios';

function Historial() {
  const rol = Number(localStorage.getItem("rol"));
  const [Historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [HistorialSelecionado, setHistorialSelecionado] = useState(null);
  //paginador 
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarHistorial = () =>{
    axios.get(`http://localhost:3100/api/historial/consultar/${busqueda}`)
    .then((res) => {
      setHistorial(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerHistorial = (page = 1) => {
      const token = localStorage.getItem("token");
      axios.get(`http://localhost:3100/api/historial/listar?page=${page}&limit=${limite}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((res)=>{
        setHistorial(res.data.historial || []);
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
      obtenerHistorial(paginaActual);
    };

    useEffect(()=>{
      obtenerHistorial();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <h2 className="text-center mb-4">Historial de Reparaciones</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button className='btn btn-primary mb-3' 
          onClick={()=> setMostrarAgregar(true)}>Agregar Historial</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad' 
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button className="btn btn-outline-secondary" onClick={buscarHistorial}>Buscar</button>
              <button className="btn btn-outline-secondary" onClick={obtenerHistorial}>resetear</button>
            </div>
          </div>

          {/* tabla de Historial*/}
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Id</th>
                  <th scope="col">Moto (Placa)</th>
                  <th scope="col">Técnico</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Descripción del Problema</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Descripción del Trabajo</th>
                  <th scope="col">Fotos</th>
                  <th scope="col">Fecha Inicio</th>
                  <th scope="col">Fecha Fin</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Historial.map((historial, index) => (
                  <tr key={index}> 
                    <td>{historial.id_historial}</td>
                    <td>{historial.placa} ({historial.modelo_moto})</td>
                    <td>{historial.nombre_tecnico} {historial.apellido_tecnico}</td>
                    <td>{historial.nombre_cliente} {historial.apellido_cliente}</td>
                    <td>{historial.descripcion_prodlema}</td>
                    <td>{historial.estado}</td>
                    <td>{historial.descripcion_trabajo}</td>
                    <td>{historial.fotos}</td>
                    <td>{historial.fecha_inicio ? historial.fecha_inicio.split('T')[0] : ""}</td>
                    <td>{historial.fecha_fin ? historial.fecha_fin.split('T')[0] : "En proceso"}</td>
                    <td>
                      <button className="btn btn-success btn-sm me-1" onClick={()=>{ 
                        setHistorialSelecionado(historial);
                        setMostrarEditar(true);}}>
                        Editar
                      </button>
                      {(rol === 1 || rol === 3) && (
                        <button className="btn btn-danger btn-sm" onClick={()=>{ 
                          setHistorialSelecionado(historial.id_historial);
                          setmostrarEliminar(true);}}>
                          Eliminar
                        </button>
                      )}
                    </td>
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
                obtenerHistorial(paginaAnterior);
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
                obtenerHistorial(paginaSiguiente);
              }}
            >
              Siguiente
            </button>
          </div>
          </div>
        </div>
      </div>

      {/*modal de agregar*/}
      {mostrarAgregar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Agregar Nuevo Historial </h5>
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
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Editar un Historial</h5>
                  <button className="btn-close" onClick={()=> setMostrarEditar(false)}></button>
                </div>
                <div className="modal-body">
                  <Editar cerrarmodal={cerrarModal} datos={HistorialSelecionado}/>
                </div>
              </div>
            </div>
          </div>  
        </div>
      )}

      {/*modal de eliminar*/}
      {mostrarEliminar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Eliminar a un Historial </h5>
                  <button className="btn-close" onClick={()=> setmostrarEliminar(false)}></button>
                </div>
                <div className="modal-body">
                  <Eliminar id={HistorialSelecionado} cerrarmodal={cerrarModal}/>
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
  const [Id_motos, setId_motos] = useState("");
  const [Id_tecnico, setId_tecnico] = useState("");
  const [Id_historial_cliente, setId_historial_cliente] = useState("");
  const [Descripcion_prodlema, setDescripcion_prodlema] = useState("");
  const [Estado, setEstado] = useState("");
  const [Descripcion_trabajo, setDescripcion_trabajo] = useState("");
  const [Fotos, setFotos] = useState("");
  const [Fecha_inicio, setFecha_inicio] = useState("");

  const add = (event) => {
    event.preventDefault();
    axios.post("http://localhost:3100/api/historial/agregar",{
      id_motos: Id_motos,
      id_tecnico: Id_tecnico,
      id_historial_cliente: Id_historial_cliente,
      descripcion_prodlema: Descripcion_prodlema,
      estado: Estado,
      descripcion_trabajo: Descripcion_trabajo,
      fotos: Fotos,
      fecha_inicio: Fecha_inicio,
    })
    .then(()=>{
      cerrarmodal();
      alert("Registro Exitoso");
    });
  }

  return (
    <form onSubmit={add}>
      <div className="mb-3">
        <label className="form-label">ID Moto</label>
        <input className="form-control" onChange={(event) => setId_motos(event.target.value)} type='number' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">ID Técnico</label>
        <input className="form-control" onChange={(event) => setId_tecnico(event.target.value)} type='number' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Cédula/ID del Cliente</label>
        <input className="form-control" onChange={(event) => setId_historial_cliente(event.target.value)} type='number' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Descripción del problema</label>
        <input className="form-control" onChange={(event) => setDescripcion_prodlema(event.target.value)} type='text' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Estado</label>
        <input className="form-control" onChange={(event) => setEstado(event.target.value)} type='text' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Descripción del trabajo</label>
        <input className="form-control" onChange={(event) => setDescripcion_trabajo(event.target.value)} type='text' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fotos</label>
        <input className="form-control" onChange={(event) => setFotos(event.target.value)} type='file'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fecha de inicio</label>
        <input className="form-control" onChange={(event) => setFecha_inicio(event.target.value)} type='date' required></input>
      </div>
      <button className='btn btn-primary mb-3' type="submit">Agregar</button>
    </form>
  )
}

function Editar({datos, cerrarmodal}){
  const [Id_historial, setId_historial] = useState("");
  const [Id_motos, setId_motos] = useState("");
  const [Id_tecnico, setId_tecnico] = useState("");
  const [Id_historial_cliente, setId_historial_cliente] = useState("");
  const [Descripcion_prodlema, setDescripcion_prodlema] = useState("");
  const [Estado, setEstado] = useState("");
  const [Descripcion_trabajo, setDescripcion_trabajo] = useState("");
  const [Fotos, setFotos] = useState("");
  const [Fecha_inicio, setFecha_inicio] = useState("");
  const [Fecha_fin, setFecha_fin] = useState("");

  useEffect(() => {
    if(datos){
      setId_historial(datos.id_historial || "");
      setId_motos(datos.id_motos || "");
      setId_tecnico(datos.id_tecnico || "");
      setId_historial_cliente(datos.id_historial_cliente || "");
      setDescripcion_prodlema(datos.descripcion_prodlema || "");
      setEstado(datos.estado || "");
      setDescripcion_trabajo(datos.descripcion_trabajo || "");
      setFotos(datos.fotos || "");
      setFecha_inicio(datos.fecha_inicio ? datos.fecha_inicio.split('T')[0] : "");
      setFecha_fin(datos.fecha_fin ? datos.fecha_fin.split('T')[0] : "");
    }
  }, [datos]);

  const editar = (event) => {
    event.preventDefault();
    axios.put(`http://localhost:3100/api/historial/actualizar/${datos.id_historial}`, {
      id_historial: Id_historial,
      id_motos: Id_motos,
      id_tecnico: Id_tecnico,
      id_historial_cliente: Id_historial_cliente,
      descripcion_prodlema: Descripcion_prodlema,
      estado: Estado,
      descripcion_trabajo: Descripcion_trabajo,
      fotos: Fotos,
      fecha_inicio: Fecha_inicio,
      fecha_fin: Fecha_fin
    }).then(() => {
      cerrarmodal();
      alert("Historial actualizado correctamente");
    });
  };

  return (
    <form onSubmit={editar}>
      <div className="mb-3">
        <label className="form-label">Id Historial</label>
        <input className="form-control" value={Id_historial} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">ID Moto</label>
        <input className="form-control" value={Id_motos} onChange={(event) => setId_motos(event.target.value)} type='number' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">ID Técnico</label>
        <input className="form-control" value={Id_tecnico} onChange={(event) => setId_tecnico(event.target.value)} type='number' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Cédula/ID del Cliente</label>
        <input className="form-control" value={Id_historial_cliente} onChange={(event) => setId_historial_cliente(event.target.value)} type='number' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Descripción del problema</label>
        <input className="form-control" value={Descripcion_prodlema} onChange={(event) => setDescripcion_prodlema(event.target.value)} type='text' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Estado</label>
        <input className="form-control" value={Estado} onChange={(event) => setEstado(event.target.value)} type='text' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Descripción del trabajo</label>
        <input className="form-control" value={Descripcion_trabajo} onChange={(event) => setDescripcion_trabajo(event.target.value)} type='text' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fotos</label>
        <input className="form-control" value={Fotos} onChange={(event) => setFotos(event.target.value)} type='file'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fecha de inicio</label>
        <input className="form-control" value={Fecha_inicio} onChange={(event) => setFecha_inicio(event.target.value)} type='date' required></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fecha de Fin</label>
        <input className="form-control" value={Fecha_fin} onChange={(event) => setFecha_fin(event.target.value)} type='date'></input>
      </div>
      <button className='btn btn-primary mb-3' type="submit">Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Historial = ()=>{
    if(window.confirm("¿seguro que quieres eliminar este Historial?")){
      axios.delete(`http://localhost:3100/api/historial/eliminar/${id}`).then(()=>{
        alert("Historial eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ", error);
        alert("el Historial no fue eliminado");
        cerrarmodal();
      });
    }
  };

  return(
    <div>
      <h5>¿Seguro que quieres eliminar este Historial?</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Historial}>Eliminar</button>
    </div>
  )
}

export default Historial;