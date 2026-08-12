import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalOverlay from '../components/ModalOverlay';
import Paginador from '../components/Paginador';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import eliminarRecurso from '../utils/eliminarRecurso';

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
      toast.error("Error en la busqueda",err);
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
        toast.error("Error al mostrar Rol: ",error);
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

          <ToastContainer position="top-right" autoClose={3000}/>

          <h2 className="text-center mb-4">Motos</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button type="button" className='btn btn-primary mb-3'
          onClick={()=> setMostrarAgregar(true)}>Agregar Motos</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad'
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button type="button" className="btn btn-outline-secondary" onClick={buscarMotos}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerMoto}>resetear</button>
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
                  <td><button type="button" className="btn btn-success" onClick={()=>{
                    setMotoselecionado(motos);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button type="button" className="btn btn-danger" onClick={()=>{
                    setMotoselecionado(motos.id_motos);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={obtenerMoto} />
        </div>
      </div>

      {mostrarAgregar && (
        <ModalOverlay titulo="Agregar Nueva Moto" onClose={()=> setMostrarAgregar(false)}>
          <Agregar cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
      {mostrarEditar && (
        <ModalOverlay titulo="Editar una Moto" onClose={()=> setMostrarEditar(false)}>
          <Editar cerrarmodal={cerrarModal} datos={Motoselecionado}/>
        </ModalOverlay>
      )}
      {mostrarEliminar && (
        <ModalOverlay titulo="Eliminar a una Moto" onClose={()=> setmostrarEliminar(false)}>
          <Eliminar id={Motoselecionado} cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
    </div>
  );
}

function Agregar({cerrarmodal}){
  const rol = Number(localStorage.getItem("rol"));

  const usuarioLogueadoRol = Number(localStorage.getItem("rol"));
  const usuarioLogueadoIdentidad = localStorage.getItem("numero_identidad") || "";

  const [Numero_identidad, setNumero_identidad] = useState(usuarioLogueadoRol === 3 ? usuarioLogueadoIdentidad : "");
  const [Marca_moto, setMarca_moto] = useState("");
  const [Modelo_moto, setModelo_moto] = useState("");
  const [Placa, setPlaca] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  const add = (event) =>{
    event.preventDefault();

    if (Numero_identidad.trim() === "" || Marca_moto.trim() === "" || Modelo_moto.trim() === "" || Placa.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.post("http://localhost:3100/api/motos/agregar",{
      numero_identidad: Numero_identidad,
      marca_moto: Marca_moto,
      modelo_moto: Modelo_moto,
      placa: Placa
    })
    .then(()=>{
      cerrarmodal();
      toast.success("reguistro Exitoso");
    })
    .catch((error)=>{
      console.error("Error al agregar moto: ", error);
      toast.error(error.response?.data?.message || "No se pudo registrar la moto");
    });
  }

  useEffect(() => {
    axios.get('http://localhost:3100/api/usuarios/listar?limit=999999')
      .then((res) => {
        setUsuarios(res.data.usuarios || []);
      })
      .catch((error) => {
        toast.error("Error al mostrar usuarios: ", error);
      });
    }, []);

  return (
    <form>
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-agregar-identidad">Numero_identidad</label>
        <select id="moto-agregar-identidad" value={Numero_identidad} className="form-control" onChange={(event) => {setNumero_identidad(event.target.value);}} >
        <option value=''>seleccione un usuario</option>
          {usuarios.filter((u) => Number(u.id_rol) === 3).map((u) => (
            <option key={u.numero_identidad} value={u.numero_identidad}> {u.nombre} {u.apellido}</option>
        ))}</select>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-agregar-marca">Marca de la moto</label>
        <input id="moto-agregar-marca" className="form-control" onChange={(event) => {setMarca_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-agregar-modelo">Modelo de la moto</label>
        <input id="moto-agregar-modelo" className="form-control" onChange={(event) => {setModelo_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-agregar-placa">Placa</label>
        <input id="moto-agregar-placa" className="form-control" onChange={(event) => {setPlaca(event.target.value);}} type='text'></input>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({datos,cerrarmodal}){
  const rol = Number(localStorage.getItem("rol"));

  const [Id_motos, setId_motos] = useState("");
  const [Numero_identidad, setNumero_identidad] = useState();
  const [Marca_moto, setMarca_moto] = useState("");
  const [Modelo_moto, setModelo_moto] = useState("");
  const [Placa, setPlaca] = useState("");

  useEffect (()=>{
    if(datos){
      setId_motos(datos.id_motos || "");
      setNumero_identidad(String(datos.numero_identidad || ""));
      setMarca_moto(datos.marca_moto || "");
      setModelo_moto(datos.modelo_moto || "");
      setPlaca(datos.placa || "");
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    if (Numero_identidad.trim() === "" || Marca_moto.trim() === "" || Modelo_moto.trim() === "" || Placa.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.put(`http://localhost:3100/api/motos/actualizar/${datos.id_motos}`,{
      id_motos:Id_motos,
      numero_identidad: Numero_identidad,
      marca_moto: Marca_moto,
      modelo_moto: Modelo_moto,
      placa: Placa
    }).then(()=>{
      cerrarmodal();
      toast.success("Moto actualizado correctamente");
    }).catch((error)=>{
      console.error("Error al actualizar moto: ", error);
      toast.error(error.response?.data?.message || "No se pudo actualizar la moto");
    });
  };
  return (
    <form>
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-editar-id">Id Moto</label>
        <input id="moto-editar-id" className="form-control" value={Id_motos} onChange={(event) => {setId_motos(event.target.value);}} type='number' disabled></input>
      </div>
      )}
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-editar-identidad">Numero_identidad</label>
        <input id="moto-editar-identidad" className="form-control" value={Numero_identidad} type='number' disabled />
      </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-editar-marca">Marca de la moto</label>
        <input id="moto-editar-marca" className="form-control" value={Marca_moto} onChange={(event) => {setMarca_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-editar-modelo">Modelo de la moto</label>
        <input id="moto-editar-modelo" className="form-control" value={Modelo_moto} onChange={(event) => {setModelo_moto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="moto-editar-placa">Placa</label>
        <input id="moto-editar-placa" className="form-control" value={Placa} onChange={(event) => {setPlaca(event.target.value);}} type='text'></input>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Rol = ()=>{
    eliminarRecurso({
      url: `http://localhost:3100/api/motos/eliminar/${id}`,
      mensajeExito: "Moto eliminado",
      mensajeError: "la Moto no fue eliminado",
      cerrarmodal
    });
  }

  return <ConfirmarEliminar mensaje="seguro que quieres eliminar esta Moto" onConfirmar={eliminar_Rol} />;
}

export default Motos;
