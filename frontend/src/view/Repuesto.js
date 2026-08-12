import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalOverlay from '../components/ModalOverlay';
import Paginador from '../components/Paginador';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import eliminarRecurso from '../utils/eliminarRecurso';

function Repuestos() {
  const [Repuesto, setRepuestos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [RepuestoSelecionado, setRepuestoSelecionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarRepuesto = () =>{
    if (busqueda.trim() === "") {
      toast.error("Ingresa un nombre para buscar");
      return;
    }
    axios.get(`http://localhost:3100/api/repuestos/buscar?nombre=${encodeURIComponent(busqueda)}`)
    .then((res) => {
      setRepuestos(res.data.repuesto || []);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
      if (err.response?.status === 404) {
        setRepuestos([]);
        toast.error("producto no encontrado");
      } else {
        toast.error(err.response?.data?.message || "No se pudo realizar la búsqueda");
      }
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

          <div className="d-flex justify-content-between align-items-center mb-3">
          <button type="button" className='btn btn-primary mb-3'
          onClick={()=> setMostrarAgregar(true)}>Agregar Repuesto</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por nombre del repuesto'
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button type="button" className="btn btn-outline-secondary" onClick={buscarRepuesto}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerRepuesto}>resetear</button>
            </div>
          </div>

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
                  <td><button type="button" className="btn btn-success" onClick={()=>{
                    setRepuestoSelecionado(repuesto);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button type="button" className="btn btn-danger" onClick={()=>{
                    setRepuestoSelecionado(repuesto.id_repuestos);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={obtenerRepuesto} />
        </div>
      </div>

      {mostrarAgregar && (
        <ModalOverlay titulo="Agregar Nuevo Repuesto" onClose={()=> setMostrarAgregar(false)}>
          <Agregar cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
      {mostrarEditar && (
        <ModalOverlay titulo="Editar un Repuesto" onClose={()=> setMostrarEditar(false)}>
          <Editar cerrarmodal={cerrarModal} datos={RepuestoSelecionado}/>
        </ModalOverlay>
      )}
      {mostrarEliminar && (
        <ModalOverlay titulo="Eliminar a un Repuesto" onClose={()=> setmostrarEliminar(false)}>
          <Eliminar id={RepuestoSelecionado} cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
    </div>
  );
}

function Agregar({cerrarmodal}){

  const [Nombre_repuesto, setNombre_repuesto] = useState("");
  const [Cantidad, setCantidad] = useState("");
  const [Id_distribuidor, setId_distribuidor] = useState("");
  const [distribuidores, setDistribuidores] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3100/api/distribuidores/listar?limit=999999')
      .then((res) => setDistribuidores(res.data.distribuidores || []))
      .catch((error) => console.error("Error al mostrar distribuidores: ", error));
  }, []);

  const add = (event) =>{
    event.preventDefault();

    if (Nombre_repuesto.trim() === "" || Cantidad.trim() === "" || Id_distribuidor === "") {
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
    .then((res)=>{
      const id_repuestos = res.data.id_repuestos;
      return axios.post("http://localhost:3100/api/repuestoDistribuidor/asignar", {
        id_repuestos,
        id_distribuidor: Id_distribuidor
      });
    })
    .then(()=>{
      cerrarmodal();
      toast.success("reguistro Exitoso");
    })
    .catch((error)=>{
      console.error("Error al agregar: ", error);
      toast.error("No se pudo completar el registro");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="repuesto-agregar-nombre">Nombre del repuesto</label>
        <input id="repuesto-agregar-nombre" className="form-control" onChange={(event) => {setNombre_repuesto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="repuesto-agregar-cantidad">Cantidad</label>
        <input id="repuesto-agregar-cantidad" className="form-control" onChange={(event) => {setCantidad(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="repuesto-agregar-distribuidor">Distribuidor</label>
        <select id="repuesto-agregar-distribuidor" className="form-control" value={Id_distribuidor} onChange={(event) => {setId_distribuidor(event.target.value);}}>
          <option value=''>seleccione un distribuidor</option>
          {distribuidores.map((d) => (
            <option key={d.id_distribuidor} value={d.id_distribuidor}>{d.nombre_distribuidor}</option>
          ))}
        </select>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({datos,cerrarmodal}){

  const [Id_repuestos, setId_repuestos] = useState("");
  const [Nombre_repuesto, setNombre_repuesto] = useState("");
  const [Cantidad, setCantidad] = useState("");
  const [Id_distribuidor, setId_distribuidor] = useState("");
  const [distribuidores, setDistribuidores] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3100/api/distribuidores/listar?limit=999999')
      .then((res) => setDistribuidores(res.data.distribuidores || []))
      .catch((error) => console.error("Error al mostrar distribuidores: ", error));
  }, []);

  useEffect (()=>{
    if(datos){
      setId_repuestos(datos.id_repuestos || "");
      setNombre_repuesto(datos.nombre_repuesto || "");
      setCantidad(datos.cantidad || "");

      axios.get(`http://localhost:3100/api/repuestoDistribuidor/porRepuesto/${datos.id_repuestos}`)
        .then((res) => {
          setId_distribuidor(res.data ? String(res.data.id_distribuidor) : "");
        })
        .catch((error) => console.error("Error al obtener distribuidor asignado: ", error));
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    if (Nombre_repuesto.trim() === "" || Cantidad.trim() === "" || Id_distribuidor === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.put(`http://localhost:3100/api/repuestos/actualizar/${datos.id_repuestos}`,{
      id_repuestos: Id_repuestos,
      nombre_repuesto: Nombre_repuesto,
      cantidad: Cantidad
    })
    .then(()=>{
      return axios.post("http://localhost:3100/api/repuestoDistribuidor/asignar", {
        id_repuestos: Id_repuestos,
        id_distribuidor: Id_distribuidor
      });
    })
    .then(()=>{
      cerrarmodal();
      toast.success("Repuesto actualizado correctamente");
    })
    .catch((error)=>{
      console.error("Error al actualizar: ", error);
      toast.error("No se pudo completar la actualización");
    });
  };
  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="repuesto-editar-id">Id Rol</label>
        <input id="repuesto-editar-id" className="form-control" value={Id_repuestos} onChange={(event) => {setId_repuestos(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="repuesto-editar-nombre">Nombre del repuesto</label>
        <input id="repuesto-editar-nombre" className="form-control" value={Nombre_repuesto} onChange={(event) => {setNombre_repuesto(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="repuesto-editar-cantidad">Cantidad</label>
        <input id="repuesto-editar-cantidad" className="form-control" value={Cantidad} onChange={(event) => {setCantidad(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="repuesto-editar-distribuidor">Distribuidor</label>
        <select id="repuesto-editar-distribuidor" className="form-control" value={Id_distribuidor} onChange={(event) => {setId_distribuidor(event.target.value);}}>
          <option value=''>seleccione un distribuidor</option>
          {distribuidores.map((d) => (
            <option key={d.id_distribuidor} value={d.id_distribuidor}>{d.nombre_distribuidor}</option>
          ))}
        </select>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Rol = ()=>{
    eliminarRecurso({
      url: `http://localhost:3100/api/repuestos/eliminar/${id}`,
      mensajeExito: "Repuesto eliminado",
      mensajeError: "el Repuesto no fue eliminado",
      cerrarmodal
    });
  }

  return <ConfirmarEliminar mensaje="seguro que quieres eliminar este Repuesto" onConfirmar={eliminar_Rol} />;
}

export default Repuestos;
