import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Repuestos() {
  const [Repuesto, setRepuestos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [RepuestoSelecionado, setRepuestoSelecionado] = useState(null);
  //paginador 
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarRepuesto = () =>{
    axios.get(`http://localhost:3100/api/repuestos/consultar/${busqueda}`)
    .then((res) => {
      setRepuestos(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerRepuesto = (page = 1) => {
      axios.get(`http://localhost:3100/api/repuestos/listar?page=${page}&limit=${limite}`).then((res)=>{
        setRepuestos(res.data.repuesto || []);
        setTotalPaginas(res.data.totalPages || 1);
        setPaginaActual(res.data.currentPage || 1);
      }).catch((error)=>{
        console.error("Error al mostrar Repuestos: ", error);
      });
    };

    const cerrarModal =()=>{
      setMostrarAgregar(false);
      setMostrarEditar(false);
      setmostrarEliminar(false);
      obtenerRepuesto(paginaActual);
    };

    useEffect(()=>{
      obtenerRepuesto();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <ToastContainer position="top-right" autoClose={3000} />
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
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button 
              className="btn btn-outline-primary" 
              disabled={paginaActual === 1} 
              onClick={() => {
                const paginaAnterior = paginaActual - 1;
                obtenerRepuesto(paginaAnterior);
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
                obtenerRepuesto(paginaSiguiente);
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

    if (Nombre_repuesto.trim() === "" || Cantidad.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    const validarFormulario = () => {

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!soloLetras.test(Nombre_repuesto)) {
      toast.error("El nombre no debe contener números ni caracteres especiales.");
      return false;
    }

    return true;
    };

  if (!validarFormulario()) {
    return; 
    }

    axios.post("http://localhost:3100/api/repuestos/agregar",{
      nombre_repuesto:Nombre_repuesto,
      cantidad:Cantidad
    })
    .then(()=>{
      cerrarmodal();
      toast.success("reguistro Exitoso");
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

    if (Nombre_repuesto.trim() === "" || Cantidad.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.put(`http://localhost:3100/api/repuestos/actualizar/${datos.id_repuestos}`,{
      id_repuestos: Id_repuestos,
      nombre_repuesto: Nombre_repuesto,
      cantidad: Cantidad
    }).then(()=>{
      cerrarmodal();
      toast.success("Repuesto actualizado correctamente");
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
      axios.delete(`http://localhost:3100/api/repuestos/eliminar/${id}`).then(()=>{
        toast.success("Repuesto eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        toast.error("el Repuesto no fue eliminado");
        cerrarmodal();
      });
    }

  return(
    <div>
      <h5>seguro que quieres eliminar este Repuesto</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Rol}>eliminar</button>
    </div>
  )
}

export default Repuestos;