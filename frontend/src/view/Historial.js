import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Historial() {
  const rol = Number(localStorage.getItem("rol"));
  const [Historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
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
                  {rol === 1 && (
                  <th scope="col">Id</th>
                  )}
                  {rol === 3 && (
                  <th scope="col">Id</th>
                  )}
                  <th scope="col">Moto (Placa)</th>
                  <th scope="col">Técnico</th>
                  {rol === 1 && (
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
                    {rol === 1 && (
                    <td>{historial.id_historial}</td>
                    )}
                    {rol === 3 && (
                    <td>{historial.id_historial_cliente }</td>
                    )}
                    <td>{historial.placa} ({historial.modelo_moto})</td>
                    <td>{historial.nombre_tecnico} {historial.apellido_tecnico}</td>
                    {rol === 1 && (
                    <td>{historial.nombre_cliente} {historial.apellido_cliente}</td>
                    )}
                    <td>{historial.estado}</td>
                    <td>{historial.fecha_inicio ? historial.fecha_inicio.split('T')[0] : ""}</td>
                    <td>
                      <button className="btn btn-info btn-sm me-1 text-white" onClick={() => { 
                        setDetalleSeleccionado(historial);
                        setMostrarDetalle(true);
                      }}>
                        Ver Detalles
                      </button>
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

      {/*modal de ver detalles*/}
      {mostrarDetalle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal d-block">
            <div className="modal-dialog modal-lg"> {/* modal-lg da más espacio */}
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">Detalles Completos del Historial</h5>
                  <button className="btn-close btn-close-white" onClick={() => setMostrarDetalle(false)}></button>
                </div>
                <div className="modal-body">
                  <Detalle datos={detalleSeleccionado} cerrarmodal={cerrarModal}/>
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
  const rol = Number(localStorage.getItem("rol"));
  const [Id_motos, setId_motos] = useState("");
  const [Id_tecnico, setId_tecnico] = useState("");
  const [Descripcion_prodlema, setDescripcion_prodlema] = useState("");
  const [Estado, setEstado] = useState("");
  const [Descripcion_trabajo, setDescripcion_trabajo] = useState("");
  const [Fotos, setFotos] = useState(null);
  const [Fecha_inicio, setFecha_inicio] = useState("");

  const [Usuarios, setUsuarios] = useState([]);
  const [Motos, setMotos] = useState([]);
  const [Tecnico, setTecnico] = useState([]);

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

    if (Id_motos.trim() === "" || Descripcion_prodlema.trim() === "" || Fecha_inicio.trim() === "") {
      toast.error("faltan datos obligatorio");
      return; 
    }

    const validarFormulario = () => {

    if (Descripcion_prodlema.length< 10 || Descripcion_prodlema.length > 1000) {
      toast.error("El problema debe tener entre 10 y 1000 caracteres.");
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
    formData.append('fecha_inicio', Fecha_inicio);
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
    });
  }

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
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Dueño de la moto (Cliente)</label>
        <select className="form-control" value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)}required>
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
        <label className="form-label">Moto asociada</label>
        <select className="form-control" value={Id_motos} onChange={(event) => setId_motos(event.target.value)} disabled={!clienteSeleccionado} required>
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
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Técnico Asignado</label>
        <select className="form-control" value={Id_tecnico} onChange={(event) => setId_tecnico(event.target.value)}>
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
        <label className="form-label">Descripción del problema</label>
        <input className="form-control" onChange={(event) => setDescripcion_prodlema(event.target.value)} type='text' required></input>
      </div>
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Estado</label>
        <select className="form-control" onChange={(event) => setEstado(event.target.value)} type='text'>
          <option value="">Selecione un estado</option>
          <option value="En Asignacion">En Asignacion </option>
          <option value="En Proceso">En Proceso </option>
          <option value="Finalizado">Finalizado </option>
        </select>
      </div>
      )}
      {rol === 1 &&(
      <div className="mb-3">
        <label className="form-label">Descripción del trabajo</label>
        <input className="form-control" onChange={(event) => setDescripcion_trabajo(event.target.value)} type='text'></input>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label">Fotos</label>
        <input className="form-control" onChange={(event) => setFotos(event.target.files[0])} type='file'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fecha de inicio</label>
        <input className="form-control" onChange={(event) => setFecha_inicio(event.target.value)} type='date' required></input>
      </div>
      {rol === 1 && (
        <div className="mb-3">
  <label className="form-label fw-bold">Repuestos Utilizados</label>
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

  const [Usuarios, setUsuarios] = useState([]);
  const [Motos, setMotos] = useState([]);
  const [Tecnico, setTecnico] = useState([]);

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

  const editar = (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append('id_historial', Id_historial);
    formData.append('id_motos', Id_motos || null);
    formData.append('id_tecnico', Id_tecnico || null);
    formData.append('id_historial_cliente', Id_historial_cliente || null);
    formData.append('descripcion_prodlema', Descripcion_prodlema);
    formData.append('estado', Estado);
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

    if (Descripcion_prodlema.length< 10 || Descripcion_prodlema.length > 1000) {
      toast.error("El problema debe tener entre 10 y 1000 caracteres.");
      return false;
    }
    
    if (Descripcion_trabajo.length< 10 || Descripcion_trabajo.length > 1000) {
      toast.error("El solucion debe tener entre 10 y 1000 caracteres.");
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
        <label className="form-label">Id Historial</label>
        <input className="form-control" value={Id_historial} type='number' disabled></input>
      </div>
      )}
      {rol === 3 && (
        <div className="mb-3">
          <label className="form-label">Id Historial</label>
          <input className="form-control" value={Id_historial_cliente} type='number' disabled></input>
        </div>
      )}
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Dueño de la moto (Cliente)</label>
        <select className="form-control" value={clienteSeleccionado} onChange={(e) => {setClienteSeleccionado(e.target.value); setId_motos("");}}required>
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
        <label className="form-label">Moto </label>
        <select className="form-control" value={Id_motos} onChange={(event) => setId_motos(event.target.value)} disabled={rol === 2 || !clienteSeleccionado} required>
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
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Técnico Asignado</label>
        <select className="form-control" value={Id_tecnico} onChange={(event) => setId_tecnico(event.target.value)}>
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
        <label className="form-label">Descripción del problema</label>
        <input className="form-control" value={Descripcion_prodlema} onChange={(event) => setDescripcion_prodlema(event.target.value)} type='text' required></input>
      </div>
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Estado</label>
        <select className="form-control" value={Estado} onChange={(event) => setEstado(event.target.value)} type='text'>
          <option value="">Selecione un estado</option>
          <option value="En Asignacion">En Asignacion </option>
          <option value="En Proceso">En Proceso </option>
          <option value="Finalizado">Finalizado </option>
        </select>
      </div>
      )}
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Descripción del trabajo</label>
        <input className="form-control" value={Descripcion_trabajo} onChange={(event) => setDescripcion_trabajo(event.target.value)} type='text'></input>
      </div>
      )}
      {(rol === 1 || rol === 3) && (
      <div className="mb-3">
        <label className="form-label">Fotos</label>
        <input className="form-control" onChange={(event) => setFotos(event.target.files[0])} type='file'></input>
      </div>
      )}
      <div className="mb-3">
        <label className="form-label">Fecha de inicio</label>
        <input className="form-control" value={Fecha_inicio} onChange={(event) => setFecha_inicio(event.target.value)} type='date' required></input>
      </div>
      {rol === 1 && (
      <div className="mb-3">
        <label className="form-label">Fecha de Fin</label>
        <input className="form-control" value={Fecha_fin} onChange={(event) => setFecha_fin(event.target.value)} type='date'></input>
      </div>
      )}
      {(rol === 1 || rol === 2) && (
        <div className="mb-3">
  <label className="form-label fw-bold">Repuestos Utilizados</label>
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
      <button className='btn btn-primary mb-3' type="submit">Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_Historial = ()=>{
      axios.delete(`http://localhost:3100/api/historial/eliminar/${id}`).then(()=>{
        toast.success("Historial eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ", error);
        toast.error("el Historial no fue eliminado");
        cerrarmodal();
      });
    }

  return(
    <div>
      <h5>¿Seguro que quieres eliminar este Historial?</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_Historial}>Eliminar</button>
    </div>
  )
}

function Detalle({ datos, cerrarmodal }) {
  const rol = Number(localStorage.getItem("rol"));
  if (!datos) return null;

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
        <button className="btn btn-secondary" onClick={cerrarmodal}>Cerrar Detalles</button>
      </div>

    </div>
  );
}

export default Historial;