import { useEffect, useState } from 'react';
import axios from 'axios';

function Motos() {
  const rol = Number(localStorage.getItem("rol"));
  const [Motos, setMotos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [Motoselecionado, setMotoselecionado] = useState(null);
  //paginador 
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarMotos = () =>{
    axios.get(`http://localhost:3100/api/motos/consultar/${busqueda}`)
    .then((res) => {
      setMotos(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerMoto = (page = 1) => {
      const token = localStorage.getItem("token");
      axios.get(`http://localhost:3100/api/motos/listar?page=${page}&limit=${limite}`,{
        Headers:{
          'Authorization': `Bearer ${token}`
        }
      }).then((res)=>{
        setMotos(res.data.motos || []);
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
      obtenerMoto(paginaActual);
    };

    useEffect(()=>{
      obtenerMoto();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <h2 className="text-center mb-4">Motos</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button className='btn btn-primary mb-3' 
          onClick={()=> setMostrarAgregar(true)}>Agregar Motos</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad' 
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button className="btn btn-outline-secondary" onClick={buscarMotos}>Buscar</button>
              <button className="btn btn-outline-secondary" onClick={obtenerMoto}>resetear</button>
            </div>
          </div>

          {/* tabal de Roles*/}

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                {rol === 1 && (<th scope="col">Id del la Motos</th>)}
                {rol === 1 && (<th scope="col">Numero de identidad</th>)}
                {rol === 1 && (<th scope="col">Nombre y apellido</th>)}
                <th scope="col">Marca de la moto</th>
                <th scope="col">Modelo de la moto</th>
                <th scope="col">Placa</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Motos.map((motos, index) => (
                <tr key={index}> 
                  { rol === 1 && (<td>{motos.id_motos}</td>)}
                  { rol === 1 && (<td>{motos.numero_identidad}</td>)}
                  { rol === 1 && (<td>{motos.nombre}, {motos.apellido}</td>)}
                  <td>{motos.marca_moto}</td>
                  <td>{motos.modelo_moto}</td>
                  <td>{motos.placa}</td>
                  <td><button className="btn btn-success" onClick={()=>{ 
                    setMotoselecionado(motos);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button className="btn btn-danger" onClick={()=>{ 
                    setMotoselecionado(motos.id_motos);
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
                obtenerMoto(paginaAnterior);
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
                obtenerMoto(paginaSiguiente);
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
                  <h5 className="modal-title">Agregar Nueva Moto </h5>
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
                  <h5 className="modal-title">Editar una Moto</h5>
                  <button className="btn-close" onClick={()=> setMostrarEditar(false)}></button>
                </div>
                <div className="modal-body">
                  <Editar cerrarmodal={cerrarModal} datos={Motoselecionado}/>
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
                  <h5 className="modal-title">Eliminar a una Moto </h5>
                  <button className="btn-close" onClick={()=> setmostrarEliminar(false)}></button>
                </div>
                <div className="modal-body">
                  <Eliminar id={Motoselecionado} cerrarmodal={cerrarModal}/>
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

  const [Numero_identidad, setNumero_identidad] = useState("");
  const [Marca_moto, setMarca_moto] = useState("");
  const [Modelo_moto, setModelo_moto] = useState("");
  const [Placa, setPlaca] = useState("");

  const add = (event) =>{
    event.preventDefault();

    axios.post("http://localhost:3100/api/motos/agregar",{
      numero_identidad: Numero_identidad,
      marca_moto: Marca_moto,
      modelo_moto: Modelo_moto,
      placa: Placa
    })
    .then(()=>{
      cerrarmodal();
      alert("reguistro Exitoso");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Numero_identidad</label>
        <input className="form-control" onChange={(event) => {setNumero_identidad(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Marca de la moto</label>
        <input className="form-control" onChange={(event) => {setMarca_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Modelo de la moto</label>
        <input className="form-control" onChange={(event) => {setModelo_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Placa</label>
        <input className="form-control" onChange={(event) => {setPlaca(event.target.value);}} type='text'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({datos,cerrarmodal}){

  const [Id_motos, setId_motos] = useState("");
  const [Numero_identidad, setNumero_identidad] = useState("");
  const [Marca_moto, setMarca_moto] = useState("");
  const [Modelo_moto, setModelo_moto] = useState("");
  const [Placa, setPlaca] = useState("");


  useEffect (()=>{
    if(datos){
      setId_motos(datos.id_motos || "");
      setNumero_identidad(datos.numero_identidad || "");
      setMarca_moto(datos.marca_moto || "");
      setModelo_moto(datos.modelo_moto || "");
      setPlaca(datos.placa || "");
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    axios.put(`http://localhost:3100/api/motos/actualizar/${datos.id_motos}`,{
      id_motos:Id_motos,
      numero_identidad: Numero_identidad,
      marca_moto: Marca_moto,
      modelo_moto: Modelo_moto,
      placa: Placa
    }).then(()=>{
      cerrarmodal();
      alert("Moto actualizado correctamente");
    });
  };
  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Id Moto</label>
        <input className="form-control"value={Id_motos} onChange={(event) => {setId_motos(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Numero_identidad</label>
        <input className="form-control" value={Numero_identidad} onChange={(event) => {setNumero_identidad(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Marca de la moto</label>
        <input className="form-control" value={Marca_moto} onChange={(event) => {setMarca_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Modelo de la moto</label>
        <input className="form-control" value={Modelo_moto} onChange={(event) => {setModelo_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Placa</label>
        <input className="form-control" value={Placa} onChange={(event) => {setPlaca(event.target.value);}} type='text'></input>
      </div>
      <button className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Rol = ()=>{
    if(window.confirm("¿seguro que quieres eliminar esta Moto?")){
      axios.delete(`http://localhost:3100/api/motos/eliminar/${id}`).then(()=>{
        alert("Moto eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        alert("la Moto no fue eliminado");
        cerrarmodal();
      });
    }
  };

  return(
    <div>
      <h5>seguro que quieres eliminar esta Moto</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Rol}>eliminar</button>
    </div>
  )
}

export default Motos;