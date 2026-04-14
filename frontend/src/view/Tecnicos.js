import { useEffect, useState } from 'react';
import axios from 'axios';

function Tecnicos() {
  const [Tecnico, setTecnico] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [TecnicoSelecionado, setTecnicoSelecionado] = useState(null);

  const buscarTecnico = () =>{
    axios.get(`http://localhost:3100/api/tecnico/consultar/${busqueda}`)
    .then((res) => {
      setTecnico(Array.isArray(res.data) ? res.data : [res.data]);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerTecnicos = () => {
      axios.get('http://localhost:3100/api/tecnico/listar').then((res)=>{
        setTecnico(res.data);
      }).catch((error)=>{
        console.error("Error al mostrar Rol: ",error);
      });
    };

    const cerrarModal =()=>{
      setMostrarAgregar(false);
      setMostrarEditar(false);
      setmostrarEliminar(false);
      obtenerTecnicos();
    };

    useEffect(()=>{
      obtenerTecnicos();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <h2 className="text-center mb-4">Tecnicos</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button className='btn btn-primary mb-3' 
          onClick={()=> setMostrarAgregar(true)}>Agregar Tecnico</button>

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
                <th scope="col">Reparaciones asignadas</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Tecnico.map((tecnicos, index) => (
                <tr key={index}> 
                  <td>{tecnicos.id_tecnico}</td>
                  <td>{tecnicos.numero_identidad}</td>
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

  const [Numero_identidad , setNumero_identidad ] = useState("");
  const [Reparaciones_asignadas	, setReparaciones_asignadas] = useState("");

  const add = (event) =>{
    event.preventDefault();

    axios.post("http://localhost:3100/api/tecnico/agregar",{
      numero_identidad:Numero_identidad,
      reparaciones_asignadas:Reparaciones_asignadas
    })
    .then(()=>{
      cerrarmodal();
      alert("reguistro Exitoso");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Numero de identidad</label>
        <input className="form-control" onChange={(event) => {setNumero_identidad(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Reparaciones asignadas</label>
        <input className="form-control" onChange={(event) => {setReparaciones_asignadas(event.target.value);}} type='text'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
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

    axios.put(`http://localhost:3100/api/tecnico/actualizar/${datos.id_tecnico}`,{
      id_tecnico:Id_tecnico,
      numero_identidad:Numero_identidad,
      reparaciones_asignadas:Reparaciones_asignadas
    }).then(()=>{
      cerrarmodal();
      alert("Rol actualizado correctamente");
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
        alert("Tecnico eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        alert("el Tecnico no fue eliminado");
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