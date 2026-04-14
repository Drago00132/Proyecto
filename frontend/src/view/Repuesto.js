import { useEffect, useState } from 'react';
import axios from 'axios';

function Repuestos() {
  const [Repuesto, setRepuestos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [RepuestoSelecionado, setRepuestoSelecionado] = useState(null);

  const buscarRepuesto = () =>{
    axios.get(`http://localhost:3100/api/repuestos/consultar/${busqueda}`)
    .then((res) => {
      setRepuestos(Array.isArray(res.data) ? res.data : [res.data]);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerRepuesto = () => {
      axios.get('http://localhost:3100/api/repuestos/listar').then((res)=>{
        setRepuestos(res.data);
      }).catch((error)=>{
        console.error("Error al mostrar Rol: ",error);
      });
    };

    const cerrarModal =()=>{
      setMostrarAgregar(false);
      setMostrarEditar(false);
      setmostrarEliminar(false);
      obtenerRepuesto();
    };

    useEffect(()=>{
      obtenerRepuesto();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <h2 className="text-center mb-4">Repuestos</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button className='btn btn-primary mb-3' 
          onClick={()=> setMostrarAgregar(true)}>Agregar Repuesto</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad' 
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button className="btn btn-outline-secondary" onClick={buscarRepuesto}>Buscar</button>
              <button className="btn btn-outline-secondary" onClick={obtenerRepuesto}>resetear</button>
            </div>
          </div>

          {/* tabal de Roles*/}

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Id del Repuesto</th>
                <th scope="col">Nombre</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Repuesto.map((repuesto, index) => (
                <tr key={index}> 
                  <td>{repuesto.id_repuestos}</td>
                  <td>{repuesto.nombre_repuesto}</td>
                  <td>{repuesto.cantidad}</td>
                  <td><button className="btn btn-success" onClick={()=>{ 
                    setRepuestoSelecionado(repuesto);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button className="btn btn-danger" onClick={()=>{ 
                    setRepuestoSelecionado(repuesto.id_repuestos);
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
                  <h5 className="modal-title">Agregar Nuevo Repuesto </h5>
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
                  <h5 className="modal-title">Editar un Repuesto</h5>
                  <button className="btn-close" onClick={()=> setMostrarEditar(false)}></button>
                </div>
                <div className="modal-body">
                  <Editar cerrarmodal={cerrarModal} datos={RepuestoSelecionado}/>
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
                  <h5 className="modal-title">Eliminar a un Repuesto </h5>
                  <button className="btn-close" onClick={()=> setmostrarEliminar(false)}></button>
                </div>
                <div className="modal-body">
                  <Eliminar id={RepuestoSelecionado} cerrarmodal={cerrarModal}/>
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

  const [Nombre_repuesto, setNombre_repuesto] = useState("");
  const [Cantidad, setCantidad] = useState("");

  const add = (event) =>{
    event.preventDefault();

    axios.post("http://localhost:3100/api/repuestos/agregar",{
      nombre_repuesto:Nombre_repuesto,
      cantidad:Cantidad
    })
    .then(()=>{
      cerrarmodal();
      alert("reguistro Exitoso");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Nombre del repuesto</label>
        <input className="form-control" onChange={(event) => {setNombre_repuesto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Cantidad</label>
        <input className="form-control" onChange={(event) => {setCantidad(event.target.value);}} type='number'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({datos,cerrarmodal}){

  const [Id_repuestos, setId_repuestos] = useState("");
  const [Nombre_repuesto, setNombre_repuesto] = useState("");
  const [Cantidad, setCantidad] = useState("");

  useEffect (()=>{
    if(datos){
      setId_repuestos(datos.id_repuestos || "");
      setNombre_repuesto(datos.nombre_repuesto || "");
      setCantidad(datos.cantidad || "");
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    axios.put(`http://localhost:3100/api/repuestos/actualizar/${datos.id_repuestos}`,{
      id_repuestos: Id_repuestos,
      nombre_repuesto: Nombre_repuesto,
      cantidad: Cantidad
    }).then(()=>{
      cerrarmodal();
      alert("Repuesto actualizado correctamente");
    });
  };
  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Id Rol</label>
        <input className="form-control" value={Id_repuestos} onChange={(event) => {setId_repuestos(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre del repuesto</label>
        <input className="form-control" value={Nombre_repuesto} onChange={(event) => {setNombre_repuesto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Cantidad</label>
        <input className="form-control" value={Cantidad} onChange={(event) => {setCantidad(event.target.value);}} type='number'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Rol = ()=>{
    if(window.confirm("¿seguro que quieres eliminar este Repuesto?")){
      axios.delete(`http://localhost:3100/api/repuestos/eliminar/${id}`).then(()=>{
        alert("Repuesto eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        alert("el Repuesto no fue eliminado");
        cerrarmodal();
      });
    }
  };

  return(
    <div>
      <h5>seguro que quieres eliminar este Repuesto</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Rol}>eliminar</button>
    </div>
  )
}

export default Repuestos;