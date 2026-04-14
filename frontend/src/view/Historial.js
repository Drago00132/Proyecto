import { useEffect, useState } from 'react';
import axios from 'axios';

function Historial() {
  const [Historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [HistorialSelecionado, setHistorialSelecionado] = useState(null);

  const buscarHistorial = () =>{
    axios.get(`http://localhost:3100/api/historial/consultar/${busqueda}`)
    .then((res) => {
      setHistorial(Array.isArray(res.data) ? res.data : [res.data]);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerHistorial = () => {
      axios.get('http://localhost:3100/api/historial/listar').then((res)=>{
        setHistorial(res.data);
      }).catch((error)=>{
        console.error("Error al mostrar Rol: ",error);
      });
    };

    const cerrarModal =()=>{
      setMostrarAgregar(false);
      setMostrarEditar(false);
      setmostrarEliminar(false);
      obtenerHistorial();
    };

    useEffect(()=>{
      obtenerHistorial();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <h2 className="text-center mb-4">Historial</h2>

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

          {/* tabal de Roles*/}

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Id del Historial</th>
                <th scope="col">moto</th>
                <th scope="col">tecnico</th>
                <th scope="col">Id del Historial para el cliente</th>
                <th scope="col">descripcion del prodlema</th>
                <th scope="col">estado</th>
                <th scope="col">descripcion del trabajo</th>
                <th scope="col">fotos</th>
                <th scope="col">fecha de inicio</th>
                <th scope="col">fecha de fin</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Historial.map((historial, index) => (
                <tr key={index}> 
                  <td>{historial.id_historial}</td>
                  <td>{historial.id_motos}</td>
                  <td>{historial.id_tecnico}</td>
                  <td>{historial.id_historial_cliente}</td>
                  <td>{historial.descripcion_prodlema}</td>
                  <td>{historial.estado}</td>
                  <td>{historial.descripcion_trabajo}</td>
                  <td>{historial.fotos}</td>
                  <td>{historial.fecha_inicio}</td>
                  <td>{historial.fecha_fin}</td>
                  <td><button className="btn btn-success" onClick={()=>{ 
                    setHistorialSelecionado(historial);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button className="btn btn-danger" onClick={()=>{ 
                    setHistorialSelecionado(historial.id_historial);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
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

  const add = (event) =>{
    event.preventDefault();

    axios.post("http://localhost:3100/api/historial/agregar",{
      id_motos:Id_motos,
      id_tecnico:Id_tecnico,
      id_historial_cliente:Id_historial_cliente,
      descripcion_prodlema:Descripcion_prodlema,
      estado:Estado,
      descripcion_trabajo:Descripcion_trabajo,
      fotos:Fotos,
      fecha_inicio:Fecha_inicio,
    })
    .then(()=>{
      cerrarmodal();
      alert("reguistro Exitoso");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label">moto</label>
        <input className="form-control" onChange={(event) => {setId_motos(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">tecnico</label>
        <input className="form-control" onChange={(event) => {setId_tecnico(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Id del Historial para el cliente</label>
        <input className="form-control" onChange={(event) => {setId_historial_cliente(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">descripcion del prodlema</label>
        <input className="form-control" onChange={(event) => {setDescripcion_prodlema(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">estado</label>
        <input className="form-control" onChange={(event) => {setEstado(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">descripcion del trabajo</label>
        <input className="form-control" onChange={(event) => {setDescripcion_trabajo(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">fotos</label>
        <input className="form-control" onChange={(event) => {setFotos(event.target.value);}} type='file'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">fecha de inicio</label>
        <input className="form-control" onChange={(event) => {setFecha_inicio(event.target.value);}} type='date'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({datos,cerrarmodal}){

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

  useEffect (()=>{
    if(datos){
      setId_historial(datos.id_historial || "");
      setId_motos(datos.id_motos || "");
      setId_tecnico(datos.id_tecnico || "");
      setId_historial_cliente(datos.id_historial_cliente || "");
      setDescripcion_prodlema(datos.descripcion_prodlema || "");
      setEstado(datos.estado || "");
      setDescripcion_trabajo(datos.descripcion_trabajo || "");
      setFotos(datos.fotos || "");
      setFecha_inicio(datos.fecha_inicio.split('T')[0] || "");
      setFecha_fin(datos.fecha_fin.split('T')[0] || "");
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    axios.put(`http://localhost:3100/api/historial/actualizar/${datos.id_rol}`,{
      id_historial:Id_historial,
      id_motos:Id_motos,
      id_tecnico:Id_tecnico,
      id_historial_cliente:Id_historial_cliente,
      descripcion_prodlema:Descripcion_prodlema,
      estado:Estado,
      descripcion_trabajo:Descripcion_trabajo,
      fotos:Fotos,
      fecha_inicio:Fecha_inicio,
      fecha_fin:Fecha_fin
    }).then(()=>{
      cerrarmodal();
      alert("Repuesto actualizado correctamente");
    });
  };
  return (
    <form>
    <div className="mb-3">
        <label className="form-label">Id Historial</label>
        <input className="form-control" value={Id_historial} onChange={(event) => {setId_historial(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">moto</label>
        <input className="form-control" value={Id_motos} onChange={(event) => {setId_motos(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">tecnico</label>
        <input className="form-control" value={Id_tecnico} onChange={(event) => {setId_tecnico(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Id del Historial para el cliente</label>
        <input className="form-control" value={Id_historial_cliente} onChange={(event) => {setId_historial_cliente(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">descripcion del prodlema</label>
        <input className="form-control" value={Descripcion_prodlema} onChange={(event) => {setDescripcion_prodlema(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">estado</label>
        <input className="form-control" value={Estado} onChange={(event) => {setEstado(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">descripcion del trabajo</label>
        <input className="form-control" value={Descripcion_trabajo} onChange={(event) => {setDescripcion_trabajo(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">fotos</label>
        <input className="form-control" value={Fotos} onChange={(event) => {setFotos(event.target.value);}} type='file'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">fecha de inicio</label>
        <input className="form-control" value={Fecha_fin} onChange={(event) => {setFecha_inicio(event.target.value);}} type='date'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">fecha de Fin</label>
        <input className="form-control" value={Fecha_fin} onChange={(event) => {setFecha_fin(event.target.value);}} type='date'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Rol = ()=>{
    if(window.confirm("¿seguro que quieres eliminar este Repuesto?")){
      axios.delete(`http://localhost:3100/api/historial/eliminar/${id}`).then(()=>{
        alert("Historial eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        alert("el Historial no fue eliminado");
        cerrarmodal();
      });
    }
  };

  return(
    <div>
      <h5>seguro que quieres eliminar este Historial</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Rol}>eliminar</button>
    </div>
  )
}

export default Historial;