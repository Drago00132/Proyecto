import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalOverlay from '../components/ModalOverlay';
import Paginador from '../components/Paginador';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import eliminarRecurso from '../utils/eliminarRecurso';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Historial() {
  const rol = Number(localStorage.getItem("rol"));
  const [Historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setMostrarAgregar(true);
      searchParams.delete('nuevo');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [HistorialSelecionado, setHistorialSelecionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
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
      setMostrarDetalle(false);
      obtenerHistorial(paginaActual);
    };

    useEffect(()=>{
      obtenerHistorial();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5">
        <div className="card p-4">
          <ToastContainer position="top-right" autoClose={3000} />
          <h2 className="text-center mb-4">Servicio</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
            {(rol === 1 || rol === 16 || rol === 17) && (
          <button type="button" className='btn btn-primary mb-3'
          onClick={()=> setMostrarAgregar(true)}>Agregar Servicio</button>
            )}

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad'
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button type="button" className="btn btn-outline-secondary" onClick={buscarHistorial}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerHistorial}>resetear</button>
            </div>
          </div>

          {/* tabla de Servicio*/}
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  {(rol === 1 || rol === 16 || rol === 17) && (
                  <th scope="col">Id</th>
                  )}
                  {rol === 3 && (
                  <th scope="col">Id</th>
                  )}
                  <th scope="col">Moto (Placa)</th>
                  <th scope="col">Técnico</th>
                  {(rol === 1 || rol === 16 || rol === 17) && (
                  <th scope="col">Cliente</th>
                  )}
                  <th scope="col">Estado</th>
                  <th scope="col">Fecha Inicio</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Historial.map((historial, index) => (
                  <tr key={index}>
                    {(rol === 1 || rol === 16 || rol === 17) && (
                    <td>{historial.id_historial}</td>
                    )}
                    {rol === 3 && (
                    <td>{historial.id_historial_cliente }</td>
                    )}
                    <td>{historial.placa} ({historial.modelo_moto})</td>
                    <td>{historial.nombre_tecnico} {historial.apellido_tecnico}</td>
                    {(rol === 1 || rol === 16 || rol === 17) && (
                    <td>{historial.nombre_cliente} {historial.apellido_cliente}</td>
                    )}
                    <td>{historial.estado}</td>
                    <td>{historial.fecha_inicio ? historial.fecha_inicio.split('T')[0] : ""}</td>
                    <td>
                      <button type="button" className="btn btn-info btn-sm me-1 text-white" onClick={() => {
                        setDetalleSeleccionado(historial);
                        setMostrarDetalle(true);
                      }}>
                        Ver Detalles
                      </button>
                      {!(rol === 3 && historial.id_tecnico) && (
                        <button type="button" className="btn btn-success btn-sm me-1" onClick={()=>{
                          setHistorialSelecionado(historial);
                          setMostrarEditar(true);}}>
                          Actualizar
                        </button>
                      )}
                      {(rol === 1 || rol === 3 || rol === 17) && !(rol === 3 && historial.id_tecnico) && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={()=>{
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
            <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={obtenerHistorial} />
          </div>
        </div>
      </div>

      {mostrarAgregar && (
        <ModalOverlay titulo="Agregar Nuevo Servicio" onClose={()=> setMostrarAgregar(false)}>
          <Agregar cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}

      {mostrarEditar && (
        <ModalOverlay titulo="Editar un Servicio" onClose={()=> setMostrarEditar(false)}>
          <Editar cerrarmodal={cerrarModal} datos={HistorialSelecionado}/>
        </ModalOverlay>
      )}

      {mostrarEliminar && (
        <ModalOverlay titulo="Eliminar a un Servicio" onClose={()=> setmostrarEliminar(false)}>
          <Eliminar id={HistorialSelecionado} cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}

      {mostrarDetalle && (
        <ModalOverlay titulo="Detalles Completos del Servicio" onClose={() => setMostrarDetalle(false)} large headerClassName="bg-info text-white">
          <Detalle datos={detalleSeleccionado} cerrarmodal={cerrarModal}/>
        </ModalOverlay>
      )}
    </div>
  );
}

function useUsuariosTecnicoMotos() {
  const [Usuarios, setUsuarios] = useState([]);
  const [Motos, setMotos] = useState([]);
  const [Tecnico, setTecnico] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    axios.get('http://localhost:3100/api/usuarios/listar?limit=999999', config)
      .then((res) => setUsuarios(res.data.usuarios || res.data || []))
      .catch((err) => console.error("Error al traer usuarios: ", err));

    axios.get('http://localhost:3100/api/tecnico/listar?limit=999999', config)
      .then((res) => setTecnico(res.data.tecnico || res.data || []))
      .catch((err) => console.error("Error al traer técnicos: ", err));

    axios.get('http://localhost:3100/api/motos/listar?limit=999999', config)
      .then((res) => setMotos(res.data.motos || res.data || []))
      .catch((err) => console.error("Error al traer motos: ", err));
  }, []);

  return { Usuarios, Motos, Tecnico };
}

function Agregar({cerrarmodal}){
  const rol = Number(localStorage.getItem("rol"));
  const [Id_motos, setId_motos] = useState("");
  const [Id_tecnico, setId_tecnico] = useState("");
  const [Descripcion_prodlema, setDescripcion_prodlema] = useState("");
  const [Estado, setEstado] = useState("");
  const [Descripcion_trabajo, setDescripcion_trabajo] = useState("");
  const [Fotos, setFotos] = useState(null);
  const [Fecha_inicio, setFecha_inicio] = useState("");

  const { Usuarios, Motos, Tecnico } = useUsuariosTecnicoMotos();

  const [repuestosDisponibles, setRepuestosDisponibles] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([{ id_repuestos: "", cantidad: 1 }]);
  const [motosFiltradas, setMotosFiltradas] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(() => {
    const rolLogueado = Number(localStorage.getItem("rol"));
    const idLogueado = localStorage.getItem("numero_identidad");
    return rolLogueado === 3 ? idLogueado : "";
  });

  const add = (event) => {
    const token = localStorage.getItem("token");
    event.preventDefault();

    if (Id_motos.trim() === "" || Descripcion_prodlema.trim() === "") {
      toast.error("faltan datos obligatorio");
      return;
    }

    const validarFormulario = () => {

    if (Descripcion_prodlema.length > 1000) {
      toast.error("El problema no debe superar los 1000 caracteres.");
      return false;
    }

    return true;
    };

    if (!validarFormulario()) {
    return;
    }

    const formData = new FormData();
    formData.append('id_motos', Id_motos);
    formData.append('id_tecnico', Id_tecnico || null);
    formData.append('descripcion_prodlema', Descripcion_prodlema);
    formData.append('estado', Estado || "En Asignacion");
    formData.append('descripcion_trabajo', Descripcion_trabajo || null);
    formData.append('repuestos', JSON.stringify(repuestosSeleccionados));
    if (Fotos) {
      formData.append('fotos', Fotos);
    }

    axios.post("http://localhost:3100/api/historial/agregar",formData,{
      headers: {
        'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}`
      }
    })
    .then(()=>{
      cerrarmodal();
      toast.success("Registro Exitoso");
    })
    .catch((error) => {
      console.error("Error al agregar historial: ", error);
      toast.error(error.response?.data?.message || "No se pudo registrar el historial");
    });
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    axios.get('http://localhost:3100/api/repuestos/listar', config)
    .then((res) => setRepuestosDisponibles(res.data.repuesto || res.data || []))
    .catch((err) => console.error("Error al traer repuestos: ", err));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      const filtradas = Motos.filter(moto => Number(moto.numero_identidad) === Number(clienteSeleccionado));
      setMotosFiltradas(filtradas);
    } else {
      setMotosFiltradas([]);
    }
    setId_motos("");
  }, [clienteSeleccionado, Motos]);

  const agregarFilaRepuesto = () => {
  setRepuestosSeleccionados([...repuestosSeleccionados, { id_repuestos: "", cantidad: 1 }]);
};

const eliminarFilaRepuesto = (index) => {
  const nuevaLista = [...repuestosSeleccionados];
  nuevaLista.splice(index, 1);
  setRepuestosSeleccionados(nuevaLista);
};

const cambiarValoresRepuesto = (index, campo, valor) => {
  const nuevaLista = [...repuestosSeleccionados];
  nuevaLista[index][campo] = valor;
  setRepuestosSeleccionados(nuevaLista);
};

  return (
    <form onSubmit={add}>
      {(rol === 1 || rol === 16 || rol === 17) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-agregar-cliente">Dueño de la moto (Cliente)</label>
        <select id="historial-agregar-cliente" className="form-control" value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)}required>
          <option value="">Seleccione un cliente</option>
          {Usuarios.filter((usr) => Number(usr.id_rol) === 3).map((usr) => (
            <option key={usr.numero_identidad} value={usr.numero_identidad}>
              {usr.nombre} {usr.apellido} ({usr.numero_identidad})
            </option>
          ))}
        </select>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-agregar-moto">Moto asociada</label>
        <select id="historial-agregar-moto" className="form-control" value={Id_motos} onChange={(event) => setId_motos(event.target.value)} disabled={!clienteSeleccionado} required>
          <option value="">
            {clienteSeleccionado ? "Seleccione una moto" : "Primero seleccione un dueño"}
          </option>
          {motosFiltradas.map((moto) => (
            <option key={moto.id_motos} value={moto.id_motos}>
              {moto.marca_moto} {moto.modelo_moto} - Placa: [{moto.placa}]
            </option>
          ))}
        </select>
      </div>
      {(rol === 1 || rol === 16 || rol === 17) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-agregar-tecnico">Técnico Asignado</label>
        <select id="historial-agregar-tecnico" className="form-control" value={Id_tecnico} onChange={(event) => setId_tecnico(event.target.value)}>
          <option value="">Seleccione un Técnico</option>
          {Tecnico.map((tec) => (
            <option key={tec.id_tecnico} value={tec.id_tecnico}>
              {tec.nombre} {tec.apellido} ({tec.numero_identidad})
            </option>
          ))}
        </select>
      </div>
        )}
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-agregar-descripcion-problema">Descripción del problema</label>
        <input id="historial-agregar-descripcion-problema" className="form-control" onChange={(event) => setDescripcion_prodlema(event.target.value)} type='text' required></input>
      </div>
      {(rol === 1 || rol === 17) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-agregar-estado">Estado</label>
        <select id="historial-agregar-estado" className="form-control" onChange={(event) => setEstado(event.target.value)} type='text'>
          <option value="">Selecione un estado</option>
          <option value="En Asignacion">En Asignacion </option>
          <option value="En Proceso">En Proceso </option>
          <option value="Finalizado">Finalizado </option>
        </select>
      </div>
      )}
      {(rol === 1 || rol === 17) &&(
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-agregar-descripcion-trabajo">Descripción del trabajo</label>
        <input id="historial-agregar-descripcion-trabajo" className="form-control" onChange={(event) => setDescripcion_trabajo(event.target.value)} type='text'></input>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-agregar-fotos">Fotos</label>
        <input id="historial-agregar-fotos" className="form-control" onChange={(event) => setFotos(event.target.files[0])} type='file'></input>
      </div>
      <div className="mb-3">
        <small className="text-muted">La fecha de ingreso se registra automáticamente al guardar.</small>
      </div>
      {(rol === 1 || rol === 17) && (
      <div className="mb-3">
        <span className="form-label fw-bold d-block">Repuestos Utilizados</span>
        {repuestosSeleccionados.map((item, index) => (
      <div key={index} className="d-flex mb-2 align-items-center">
      <select className="form-control me-2" value={item.id_repuestos} onChange={(e) => cambiarValoresRepuesto(index, 'id_repuestos', e.target.value)}>
        <option value="">Seleccione un repuesto...</option>
        {repuestosDisponibles.map((rep) => (
        <option key={rep.id_repuestos} value={rep.id_repuestos}>
          {rep.nombre_repuesto}
        </option>
      ))}
      </select>

      <input type="number" className="form-control me-2" style={{ width: '100px' }}min="1"value={item.cantidad} onChange={(e) => cambiarValoresRepuesto(index, 'cantidad', e.target.value)}placeholder="Cant."/>

      {repuestosSeleccionados.length > 1 && (
        <button type="button" className="btn btn-danger btn-sm" onClick={() => eliminarFilaRepuesto(index)}>X</button>
      )}
    </div>
  ))}
    <button type="button" className="btn btn-success btn-sm mt-1" onClick={agregarFilaRepuesto}>
      + Añadir otro repuesto
    </button>
    </div>
      )}
      <button className='btn btn-primary mb-3' type="submit">Agregar</button>
    </form>
  )
}

function Editar({datos, cerrarmodal}){
  const rol = Number(localStorage.getItem("rol"));
  const [Id_historial, setId_historial] = useState("");
  const [Id_motos, setId_motos] = useState("");
  const [Id_tecnico, setId_tecnico] = useState("");
  const [Descripcion_prodlema, setDescripcion_prodlema] = useState("");
  const [Estado, setEstado] = useState("");
  const [Descripcion_trabajo, setDescripcion_trabajo] = useState("");
  const [Id_historial_cliente, setId_historial_cliente] = useState("");
  const [Fotos, setFotos] = useState(null);
  const [Fecha_inicio, setFecha_inicio] = useState("");
  const [Fecha_fin, setFecha_fin] = useState("");

  const { Usuarios, Motos, Tecnico } = useUsuariosTecnicoMotos();

  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [motosFiltradas, setMotosFiltradas] = useState([]);
  const [repuestosDisponibles, setRepuestosDisponibles] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);

  useEffect(() => {
    if(datos){
      setId_historial(datos.id_historial || "");
      setId_motos(String(datos.id_motos || ""));
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

  const editar = (event, estadoForzado) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    const estadoAEnviar = estadoForzado || Estado;

    const formData = new FormData();
    formData.append('id_historial', Id_historial);
    formData.append('id_motos', Id_motos || null);
    formData.append('id_tecnico', Id_tecnico || null);
    formData.append('id_historial_cliente', Id_historial_cliente || null);
    formData.append('descripcion_prodlema', Descripcion_prodlema);
    formData.append('estado', estadoAEnviar);
    formData.append('descripcion_trabajo', Descripcion_trabajo);
    formData.append('fecha_inicio', Fecha_inicio || null);
    formData.append('fecha_fin', Fecha_fin || null);
    formData.append('repuestos', JSON.stringify(repuestosSeleccionados));
    if (Fotos) {
      formData.append('fotos', Fotos);
    }

    if (Id_motos.trim() === "" || Descripcion_prodlema.trim() === "" || Fecha_inicio.trim() === "") {
      toast.error("faltan datos obligatorio");
      return;
    }

    const validarFormulario = () => {

    if (Descripcion_prodlema.length > 1000) {
      toast.error("El problema no debe superar los 1000 caracteres.");
      return false;
    }
    return true;
    };

    if (!validarFormulario()) {
    return;
    }

    axios.put(`http://localhost:3100/api/historial/actualizar/${datos.id_historial}`, formData, {
      headers: {'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
    }).then(() => {
      cerrarmodal();
      toast.success("Historial actualizado correctamente");
    }).catch((error) => {
      console.error("Error al actualizar: ", error);
      toast.error("No se pudo actualizar el historial");
    });
  };

  useEffect(() => {
    if (datos && Motos.length > 0) {
      const motoAsociada = Motos.find(moto => Number(moto.id_motos) === Number(datos.id_motos));
      if (motoAsociada) {
        setClienteSeleccionado(motoAsociada.numero_identidad);
      }
    }
  }, [datos, Motos]);

  useEffect(() => {
    if (clienteSeleccionado) {
      const filtradas = Motos.filter(moto => Number(moto.numero_identidad) === Number(clienteSeleccionado));
      setMotosFiltradas(filtradas);
    } else {
      setMotosFiltradas([]);
    }
  }, [clienteSeleccionado, Motos]);

  useEffect(() => {
    if (!datos || !datos.id_historial) return;

    const token = localStorage.getItem("token");
    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    axios.get('http://localhost:3100/api/repuestos/listar?limit=999999', config)
      .then((res) => setRepuestosDisponibles(res.data.repuesto || []))
      .catch((err) => console.error(err));

    axios.get(`http://localhost:3100/api/historial/consultar/${datos.id_historial}`, config)
      .then((res) => {
        if (res.data.repuestos && res.data.repuestos.length > 0) {
          setRepuestosSeleccionados(res.data.repuestos);
        } else {
          setRepuestosSeleccionados([{ id_repuestos: "", cantidad: 1 }]);
        }
      })
      .catch((err) => console.error(err));

  }, [datos]);

  const agregarFilaRepuesto = () => {
    setRepuestosSeleccionados([...repuestosSeleccionados, { id_repuestos: "", cantidad: 1 }]);
  };

  const eliminarFilaRepuesto = (index) => {
    const nuevaLista = [...repuestosSeleccionados];
    nuevaLista.splice(index, 1);
    setRepuestosSeleccionados(nuevaLista);
  };

  const cambiarValoresRepuesto = (index, campo, valor) => {
    const nuevaLista = [...repuestosSeleccionados];
    nuevaLista[index][campo] = valor;
    setRepuestosSeleccionados(nuevaLista);
  };

  return (
    <form onSubmit={editar}>
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-id">Id Servicio</label>
        <input id="historial-editar-id" className="form-control" value={Id_historial} type='number' disabled></input>
      </div>
      )}
      {rol === 3 && (
        <div className="mb-3">
          <label className="form-label" htmlFor="historial-editar-id-cliente">Id Servicio</label>
          <input id="historial-editar-id-cliente" className="form-control" value={Id_historial_cliente} type='number' disabled></input>
        </div>
      )}
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-cliente">Dueño de la moto (Cliente)</label>
        <select id="historial-editar-cliente" className="form-control" value={clienteSeleccionado} onChange={(e) => {setClienteSeleccionado(e.target.value); setId_motos("");}}required>
          <option value="">Seleccione un cliente</option>
          {Usuarios.filter((usr) => Number(usr.id_rol) === 3).map((usr) => (
            <option key={usr.numero_identidad} value={usr.numero_identidad}>
              {usr.nombre} {usr.apellido} ({usr.numero_identidad})
            </option>
          ))}
        </select>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-moto">Moto </label>
        <select id="historial-editar-moto" className="form-control" value={Id_motos} onChange={(event) => setId_motos(event.target.value)} disabled={rol === 2 || !clienteSeleccionado} required>
          <option value="">
            {clienteSeleccionado ? "Seleccione una moto" : "Primero seleccione un dueño"}
          </option>
          {motosFiltradas.map((moto) => (
            <option key={moto.id_motos} value={moto.id_motos} >
              {moto.marca_moto} {moto.modelo_moto} - Placa: [{moto.placa}]
            </option>
          ))}
        </select>
      </div>
      {(rol === 1 || rol === 16 || rol === 17) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-tecnico">Técnico Asignado</label>
        <select id="historial-editar-tecnico" className="form-control" value={Id_tecnico} onChange={(event) => setId_tecnico(event.target.value)}>
          <option value="">Seleccione un Técnico</option>
          {Tecnico.map((tec) => (
            <option key={tec.id_tecnico} value={tec.id_tecnico}>
              {tec.nombre} {tec.apellido} ({tec.numero_identidad})
            </option>
          ))}
        </select>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-descripcion-problema" >Descripción del problema</label>
        <input disabled={!clienteSeleccionado || (rol === 16 || rol === 2)}
          id="historial-editar-descripcion-problema"
          className="form-control"
          value={Descripcion_prodlema}
          onChange={(event) => setDescripcion_prodlema(event.target.value)}
          type='text'
          required
        />
        {rol === 16 && (
          <small className="text-muted">Como Recepcionista solo puedes gestionar la asignación de técnico; el diagnóstico lo edita Técnico o Administrador.</small>
        )}
      </div>
      {(rol === 1 || rol === 17) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-estado">Estado</label>
        <select id="historial-editar-estado" className="form-control" value={Estado} onChange={(event) => setEstado(event.target.value)} type='text'>
          <option value="">Selecione un estado</option>
          <option value="En Asignacion">En Asignacion </option>
          <option value="En Proceso">En Proceso </option>
          <option value="Finalizado">Finalizado </option>
        </select>
      </div>
      )}
      {(rol === 1 || rol === 2 || rol === 17) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-descripcion-trabajo">Descripción del trabajo</label>
        <input id="historial-editar-descripcion-trabajo" className="form-control" value={Descripcion_trabajo} onChange={(event) => setDescripcion_trabajo(event.target.value)} type='text'></input>
      </div>
      )}
      {(rol === 1 || rol === 3) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-fotos">Fotos</label>
        <input id="historial-editar-fotos" className="form-control" onChange={(event) => setFotos(event.target.files[0])} type='file'></input>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-fecha-inicio">Fecha de inicio</label>
        <input
          id="historial-editar-fecha-inicio"
          className="form-control"
          value={Fecha_inicio}
          onChange={(event) => setFecha_inicio(event.target.value)}
          type='date'
          required
          disabled={rol !== 1 && rol !== 17}
        />
        {rol !== 1 && rol !== 17 && (
          <small className="text-muted">Solo Administrador o Súper Administrador pueden corregir esta fecha.</small>
        )}
      </div>
      {(rol === 1 || rol === 17) && (
      <div className="mb-3">
        <label className="form-label" htmlFor="historial-editar-fecha-fin">Fecha de Fin</label>
        <input id="historial-editar-fecha-fin" className="form-control" value={Fecha_fin} onChange={(event) => setFecha_fin(event.target.value)} type='date'></input>
      </div>
      )}
      {(rol === 1 || rol === 2 || rol === 17) && (
        <div className="mb-3">
  <span className="form-label fw-bold d-block">Repuestos Utilizados</span>
  {repuestosSeleccionados.map((item, index) => (
    <div key={index} className="d-flex mb-2 align-items-center">
      <select
        className="form-control me-2"
        value={item.id_repuestos}
        onChange={(e) => cambiarValoresRepuesto(index, 'id_repuestos', e.target.value)}
      >
        <option value="">Seleccione un repuesto...</option>
        {repuestosDisponibles.map((rep) => (
          <option key={rep.id_repuestos} value={rep.id_repuestos}>
            {rep.nombre_repuesto}
          </option>
        ))}
      </select>

      <input
        type="number"
        className="form-control me-2"
        style={{ width: '100px' }}
        min="1"
        value={item.cantidad}
        onChange={(e) => cambiarValoresRepuesto(index, 'cantidad', e.target.value)}
        placeholder="Cant."
      />

      {repuestosSeleccionados.length > 1 && (
        <button type="button" className="btn btn-danger btn-sm" onClick={() => eliminarFilaRepuesto(index)}>X</button>
      )}
    </div>
    ))}
      <button type="button" className="btn btn-success btn-sm mt-1" onClick={agregarFilaRepuesto}>
        + Añadir otro repuesto
      </button>
    </div>
      )}
      <div className="d-flex gap-2">
        <button className='btn btn-primary mb-3' type="submit">Guardar</button>
        {rol === 2 && (
          <button
            className='btn btn-success mb-3'
            type="button"
            onClick={(event) => editar(event, "Finalizado")}
            title="Marca este historial como Finalizado y guarda los cambios"
          >
            Finalizar
          </button>
        )}
      </div>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Historial = ()=>{
    eliminarRecurso({
      url: `http://localhost:3100/api/historial/eliminar/${id}`,
      mensajeExito: "Historial eliminado",
      mensajeError: "el Historial no fue eliminado",
      cerrarmodal
    });
  }

  return <ConfirmarEliminar mensaje="¿Seguro que quieres eliminar este Servicio?" onConfirmar={eliminar_Historial} />;
}

function Detalle({ datos, cerrarmodal }) {
  const rol = Number(localStorage.getItem("rol"));
  if (!datos) return null;

  const descargarPDF = async () => {
  const doc = new jsPDF();
  const COL_IZQ = 14;
  const COL_DER = 110;
  const AZUL = [13, 110, 253]; // mismo azul de btn-primary

  // --- Título ---
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...AZUL);
  doc.text(`Servicio #${datos.id_historial}`, 14, 20);
  doc.setDrawColor(...AZUL);
  doc.setLineWidth(0.8);
  doc.line(14, 24, 196, 24);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');

  let y = 34;

  const etiqueta = (texto, x, yPos) => {
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...AZUL);
    doc.text(texto, x, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
  };

  // --- Fila 1: Moto | Estado (con "badge") ---
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Moto (Placa):', COL_IZQ, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${datos.placa} (${datos.modelo_moto})`, COL_IZQ, y + 6);

  doc.setFont(undefined, 'bold');
  doc.text('Estado:', COL_DER, y);
  doc.setFillColor(90, 98, 104); // gris, como el badge "bg-secondary"
  const anchoBadge = doc.getTextWidth(datos.estado) + 8;
  doc.roundedRect(COL_DER, y + 2, anchoBadge, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'normal');
  doc.text(datos.estado, COL_DER + 4, y + 7);
  doc.setTextColor(0, 0, 0);

  y += 18;

  // --- Fila 2: Técnico | Cliente ---
  doc.setFont(undefined, 'bold');
  doc.text('Técnico:', COL_IZQ, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${datos.nombre_tecnico || ''} ${datos.apellido_tecnico || ''}`.trim() || '-', COL_IZQ, y + 6);

  if ((rol === 1 || rol === 2) && datos.nombre_cliente) {
    doc.setFont(undefined, 'bold');
    doc.text('Cliente:', COL_DER, y);
    doc.setFont(undefined, 'normal');
    doc.text(`${datos.nombre_cliente || ''} ${datos.apellido_cliente || ''}`.trim(), COL_DER, y + 6);
  }

  y += 18;

  // --- Caja "Problema" (como el bg-light de tu modal) ---
  const cajaTexto = (etiqueta, texto) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${etiqueta}:`, COL_IZQ, y);
    y += 6;
    const lineas = doc.splitTextToSize(texto || '-', 175);
    const alturaCaja = lineas.length * 5 + 6;
    doc.setFillColor(248, 249, 250); // bg-light
    doc.setDrawColor(222, 226, 230);
    doc.roundedRect(COL_IZQ, y - 4, 182, alturaCaja, 1, 1, 'FD');
    doc.setFont(undefined, 'normal');
    doc.text(lineas, COL_IZQ + 3, y + 1);
    y += alturaCaja + 6;
  };

  cajaTexto('Problema', datos.descripcion_prodlema);
  cajaTexto('Solución', datos.descripcion_trabajo || 'Sin descripción');

  // --- Fila: Fecha Inicio | Fecha Fin ---
  doc.setFont(undefined, 'bold');
  doc.text('Fecha Inicio:', COL_IZQ, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.fecha_inicio ? datos.fecha_inicio.split('T')[0] : 'N/A', COL_IZQ, y + 6);

  doc.setFont(undefined, 'bold');
  doc.text('Fecha Fin:', COL_DER, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.fecha_fin ? datos.fecha_fin.split('T')[0] : 'En proceso', COL_DER, y + 6);

  y += 18;

  // --- Tabla de repuestos ---
  doc.setFont(undefined, 'bold');
  doc.text('Repuestos Utilizados:', COL_IZQ, y);
  y += 4;

  if (datos.repuestos && datos.repuestos.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Repuesto', 'Cantidad']],
      body: datos.repuestos.map((rep) => [rep.nombre_repuesto || rep.nombre, rep.cantidad]),
      theme: 'grid',
      headStyles: { fillColor: [13, 110, 253] }, // azul, como btn-primary
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont(undefined, 'normal');
    doc.text('Ningún repuesto utilizado.', COL_IZQ, y + 6);
    y += 16;
  }

  // --- Foto de evidencia (si existe) ---
  if (datos.fotos) {
    try {
      const base64 = await cargarImagenComoBase64(`http://localhost:3100/uploads/${datos.fotos}`);
      doc.setFont(undefined, 'bold');
      doc.text('Evidencia Fotográfica:', COL_IZQ, y);
      y += 6;
      doc.addImage(base64, 'JPEG', COL_IZQ, y, 80, 60);
    } catch (error) {
      console.error('No se pudo cargar la foto para el PDF:', error);
      doc.setFont(undefined, 'italic');
      doc.text('(No se pudo cargar la foto de evidencia)', COL_IZQ, y);
    }
  }

  doc.save(`servicio-${datos.id_historial}.pdf`);
};

  return (
    <div className="container">
      <div className="row mb-3">
        <div className="col-md-6">
          <strong>Moto (Placa):</strong> {datos.placa} ({datos.modelo_moto})
        </div>
        <div className="col-md-6">
          <strong>Estado:</strong> <span className="badge bg-secondary">{datos.estado}</span>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <strong>Técnico:</strong> {datos.nombre_tecnico} {datos.apellido_tecnico}
        </div>
        {(rol === 1 || rol === 2) && datos.nombre_cliente && (
          <div className="col-md-6">
            <strong>Cliente:</strong> {datos.nombre_cliente} {datos.apellido_cliente}
          </div>
        )}
      </div>


      <div className="mb-3">
        <strong>Problema:</strong>
        <div className="p-2 border rounded bg-light mt-1">{datos.descripcion_prodlema}</div>
      </div>

      <div className="mb-3">
        <strong>Solución:</strong>
        <div className="p-2 border rounded bg-light mt-1">{datos.descripcion_trabajo || "Sin descripción"}</div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <strong>Fecha Inicio:</strong> {datos.fecha_inicio ? datos.fecha_inicio.split('T')[0] : "N/A"}
        </div>
        <div className="col-md-6">
          <strong>Fecha Fin:</strong> {datos.fecha_fin ? datos.fecha_fin.split('T')[0] : "En proceso"}
        </div>
      </div>

      <div className="mb-4">
        <strong>Repuestos Utilizados:</strong>
        {datos.repuestos && datos.repuestos.length > 0 ? (
          <ul className="list-group mt-2">
            {datos.repuestos.map((rep, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                {rep.nombre_repuesto || rep.nombre}
                <span className="badge bg-primary rounded-pill">Cantidad: {rep.cantidad}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted mt-1">Ningún repuesto utilizado.</div>
        )}
      </div>

      {datos.fotos && (
        <div className="mb-3 text-center">
          <strong>Evidencia Fotográfica:</strong>
          <div className="mt-2">
            <img
              src={`http://localhost:3100/uploads/${datos.fotos}`}
              alt="Evidencia"
              className="img-thumbnail"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      <div className="text-end">
      {datos.estado === 'Finalizado' && (
        <button type="button" className="btn btn-outline-primary me-2" onClick={descargarPDF}>Descargar PDF</button>
      )}
      <button type="button" className="btn btn-secondary" onClick={cerrarmodal}>Cerrar Detalles</button>
    </div>

    </div>
  );
}

const cargarImagenComoBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

export { Agregar as AgregarHistorial };
export default Historial; 
