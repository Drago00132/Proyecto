import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalOverlay from '../components/ModalOverlay';
import Paginador from '../components/Paginador';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import eliminarRecurso from '../utils/eliminarRecurso';

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
          <button type="button" className='btn btn-primary mb-3'
          onClick={()=> setMostrarAgregar(true)}>subir Tecnico</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad'
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button type="button" className="btn btn-outline-secondary" onClick={buscarTecnico}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerTecnicos}>resetear</button>
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
                  <td><button type="button" className="btn btn-success" onClick={()=>{
                    setTecnicoSelecionado(tecnicos);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button type="button" className="btn btn-danger" onClick={()=>{
                    setTecnicoSelecionado(tecnicos.id_tecnico);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={setPaginaActual} />
        </div>
      </div>

      {mostrarAgregar && (
        <ModalOverlay titulo="Agregar Nuevo Tecnico" onClose={()=> setMostrarAgregar(false)}>
          <Agregar cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
      {mostrarEditar && (
        <ModalOverlay titulo="Editar un Tecnico" onClose={()=> setMostrarEditar(false)}>
          <Editar cerrarmodal={cerrarModal} datos={TecnicoSelecionado}/>
        </ModalOverlay>
      )}
      {mostrarEliminar && (
        <ModalOverlay titulo="Eliminar a un Tecnico" onClose={()=> setmostrarEliminar(false)}>
          <Eliminar id={TecnicoSelecionado} cerrarmodal={cerrarModal}/>
        </ModalOverlay>
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

  setCargando(true);
  try {
    const res = await axios.post('http://localhost:3100/api/usuarios/cargar-masiva', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    toast.success(res.data?.message || "Carga masiva de técnicos exitosa");

    cerrarmodal(false);

  } catch (error) {
    toast.error(error.response?.data?.message || "No se pudo procesar la carga masiva de técnicos");
  } finally {
    setCargando(false);
  }
};

  return (
  <div className="mb-3">
    <label className="btn btn-outline-primary w-100">
      {archivo ? archivo.name : "Seleccionar archivo Excel"}
      <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => setArchivo(e.target.files[0])} />
    </label>
    <button type="button" className="btn btn-success w-100 mt-3" onClick={subirArchivo} disabled={!archivo} >{cargando ? "Procesando..." : "Subir Técnicos"}</button>
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
      setNumero_identidad(String(datos.numero_identidad || ""));
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
        <label className="form-label" htmlFor="tecnico-editar-id">Id del tecnico</label>
        <input id="tecnico-editar-id" className="form-control" value={Id_tecnico} onChange={(event) => {setId_tecnico(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="tecnico-editar-identidad">Numero de identidad</label>
        <input id="tecnico-editar-identidad" className="form-control" value={Numero_identidad} onChange={(event) => {setNumero_identidad(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="tecnico-editar-reparaciones">Reparaciones asignadas</label>
        <input id="tecnico-editar-reparaciones" className="form-control" value={Reparaciones_asignadas} onChange={(event) => {setReparaciones_asignadas(event.target.value);}} type='text'></input>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Tecnico = ()=>{
    eliminarRecurso({
      url: `http://localhost:3100/api/tecnico/eliminar/${id}`,
      mensajeExito: "Tecnico eliminado",
      mensajeError: "el Tecnico no fue eliminado",
      cerrarmodal
    });
  }

  return <ConfirmarEliminar mensaje="seguro que quieres eliminar este Tecnico" onConfirmar={eliminar_Tecnico} />;
}

export default Tecnicos;
