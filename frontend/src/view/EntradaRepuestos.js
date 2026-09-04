import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalOverlay from '../components/ModalOverlay';
import Paginador from '../components/Paginador';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import eliminarRecurso from '../utils/eliminarRecurso';

function EntradaRepuestos() {
  const [Entradas, setEntradas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [EntradaSelecionada, setEntradaSelecionada] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarEntrada = () => {
    axios.get(`http://localhost:3100/api/entradaRepuestos/consultar/${busqueda}`)
    .then((res) => {
      setEntradas(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err) => {
      console.error("Error en la busqueda", err);
    });
  };

  const obtenerEntrada = (page = 1) => {
    axios.get(`http://localhost:3100/api/entradaRepuestos/listar?page=${page}&limit=${limite}`).then((res) => {
      setEntradas(res.data.entradas || []);
      setTotalPaginas(res.data.totalPages || 1);
      setPaginaActual(res.data.currentPage || 1);
    }).catch((error) => {
      console.error("Error al mostrar Entradas: ", error);
    });
  };

  const cerrarModal = () => {
    setMostrarAgregar(false);
    setMostrarEditar(false);
    setmostrarEliminar(false);
    obtenerEntrada(paginaActual);
  };

  useEffect(() => {
    obtenerEntrada();
  }, []);

  return (
    <div className="App">
      <div className="container mt-5">
        <div className="card p-4">
          <ToastContainer position="top-right" autoClose={3000} />
          <h2 className="text-center mb-4">Entrada de Repuestos</h2>

          <div className="d-flex justify-content-between align-items-center mb-3">

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por id'
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <button type="button" className="btn btn-outline-secondary" onClick={buscarEntrada}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerEntrada}>resetear</button>
            </div>
          </div>

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Id Entrada</th>
                <th scope="col">Fecha</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Repuesto</th>
                <th scope="col">Distribuidor</th>
                <th scope="col">Registrado por</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Entradas.map((entrada, index) => (
                <tr key={index}>
                  <td>{entrada.id_entrada}</td>
                  <td>{entrada.fecha_entrada}</td>
                  <td>{entrada.cantidad_ingresada}</td>
                  <td>{entrada.nombre_repuesto}</td>
                  <td>{entrada.nombre_distribuidor}</td>
                  <td>{entrada.nombre}, {entrada.apellido}</td>
                  <td>
                    <button type="button" className="btn btn-success" onClick={() => {
                      setEntradaSelecionada(entrada);
                      setMostrarEditar(true);
                    }}>Editar</button>
                    <button type="button" className="btn btn-danger" onClick={() => {
                      setEntradaSelecionada(entrada.id_entrada);
                      setmostrarEliminar(true);
                    }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={obtenerEntrada} />
        </div>
      </div>

      {mostrarAgregar && (
        <ModalOverlay titulo="Agregar Nueva Entrada" onClose={() => setMostrarAgregar(false)}>
          <Agregar cerrarmodal={cerrarModal} />
        </ModalOverlay>
      )}
      {mostrarEditar && (
        <ModalOverlay titulo="Editar Entrada" onClose={() => setMostrarEditar(false)}>
          <Editar cerrarmodal={cerrarModal} datos={EntradaSelecionada} />
        </ModalOverlay>
      )}
      {mostrarEliminar && (
        <ModalOverlay titulo="Eliminar Entrada" onClose={() => setmostrarEliminar(false)}>
          <Eliminar id={EntradaSelecionada} cerrarmodal={cerrarModal} />
        </ModalOverlay>
      )}
    </div>
  );
}

function useRepuestosYDistribuidores() {
  const [repuestos, setRepuestos] = useState([]);
  const [distribuidores, setDistribuidores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { 'Authorization': `Bearer ${token}` } };

    axios.get('http://localhost:3100/api/repuestos/listar?limit=999999')
      .then((res) => setRepuestos(res.data.repuesto || []))
      .catch((error) => console.error("Error al mostrar repuestos: ", error));

    axios.get('http://localhost:3100/api/distribuidores/listar?limit=999999')
      .then((res) => setDistribuidores(res.data.distribuidores || []))
      .catch((error) => console.error("Error al mostrar distribuidores: ", error));

    // RF-29/RF-31: el usuario que registra la entrada se selecciona de una lista,
    // no se toma automáticamente de la sesión.
    axios.get('http://localhost:3100/api/usuarios/listar?limit=999999', config)
      .then((res) => setUsuarios(res.data.usuarios || res.data || []))
      .catch((error) => console.error("Error al mostrar usuarios: ", error));
  }, []);

  return { repuestos, distribuidores, usuarios };
}

function Agregar({ cerrarmodal }) {
  const [Fecha_entrada, setFecha_entrada] = useState("");
  const [Cantidad_ingresada, setCantidad_ingresada] = useState("");
  const [Id_repuestos, setId_repuestos] = useState("");
  const [Id_distribuidor, setId_distribuidor] = useState("");
  // RF-29: el usuario responsable se selecciona de una lista, como los demás
  // campos; se preselecciona el usuario de la sesión activa por comodidad.
  const [Numero_identidad, setNumero_identidad] = useState(localStorage.getItem("numero_identidad") || "");
  const { repuestos, distribuidores, usuarios } = useRepuestosYDistribuidores();

  const add = (event) => {
    event.preventDefault();

    if (Fecha_entrada.trim() === "" || Cantidad_ingresada.trim() === "" || Id_repuestos === "" || Id_distribuidor === "" || Numero_identidad === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.post("http://localhost:3100/api/entradaRepuestos/agregar", {
      fecha_entrada: Fecha_entrada,
      cantidad_ingresada: Cantidad_ingresada,
      id_repuestos: Id_repuestos,
      id_distribuidor: Id_distribuidor,
      numero_identidad: Numero_identidad
    })
    .then(() => {
      cerrarmodal();
      toast.success("reguistro Exitoso");
    })
    .catch((error) => {
      console.error("Error al agregar entrada: ", error);
      toast.error(error.response?.data?.message || "No se pudo registrar la entrada");
    });
  }

  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-agregar-fecha">Fecha de entrada</label>
        <input id="entrada-agregar-fecha" className="form-control" onChange={(event) => { setFecha_entrada(event.target.value); }} type='date'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-agregar-cantidad">Cantidad ingresada</label>
        <input id="entrada-agregar-cantidad" className="form-control" onChange={(event) => { setCantidad_ingresada(event.target.value); }} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-agregar-repuesto">Repuesto</label>
        <select id="entrada-agregar-repuesto" value={Id_repuestos} className="form-control" onChange={(event) => { setId_repuestos(event.target.value); }}>
          <option value=''>seleccione un repuesto</option>
          {repuestos.map((r) => (
            <option key={r.id_repuestos} value={r.id_repuestos}>{r.nombre_repuesto}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-agregar-distribuidor">Distribuidor</label>
        <select id="entrada-agregar-distribuidor" value={Id_distribuidor} className="form-control" onChange={(event) => { setId_distribuidor(event.target.value); }}>
          <option value=''>seleccione un distribuidor</option>
          {distribuidores.map((d) => (
            <option key={d.id_distribuidor} value={d.id_distribuidor}>{d.nombre_distribuidor}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-agregar-usuario">Usuario responsable</label>
        <select id="entrada-agregar-usuario" value={Numero_identidad} className="form-control" onChange={(event) => { setNumero_identidad(event.target.value); }}>
          <option value=''>seleccione un usuario</option>
          {usuarios.map((u) => (
            <option key={u.numero_identidad} value={u.numero_identidad}>{u.nombre} {u.apellido} ({u.numero_identidad})</option>
          ))}
        </select>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({ datos, cerrarmodal }) {
  const [Id_entrada, setId_entrada] = useState("");
  const [Fecha_entrada, setFecha_entrada] = useState("");
  const [Cantidad_ingresada, setCantidad_ingresada] = useState("");
  const [Id_repuestos, setId_repuestos] = useState("");
  const [Id_distribuidor, setId_distribuidor] = useState("");
  const [Numero_identidad, setNumero_identidad] = useState("");
  const { repuestos, distribuidores, usuarios } = useRepuestosYDistribuidores();

  useEffect(() => {
    if (datos) {
      setId_entrada(datos.id_entrada || "");
      setFecha_entrada(datos.fecha_entrada ? datos.fecha_entrada.substring(0, 10) : "");
      setCantidad_ingresada(datos.cantidad_ingresada || "");
      setId_repuestos(String(datos.id_repuestos || ""));
      setId_distribuidor(String(datos.id_distribuidor || ""));
      setNumero_identidad(String(datos.numero_identidad || ""));
    }
  }, [datos]);

  const editar = (event) => {
    event.preventDefault();

    if (Fecha_entrada.trim() === "" || String(Cantidad_ingresada).trim() === "" || Id_repuestos === "" || Id_distribuidor === "" || Numero_identidad === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.put(`http://localhost:3100/api/entradaRepuestos/actualizar/${datos.id_entrada}`, {
      fecha_entrada: Fecha_entrada,
      cantidad_ingresada: Cantidad_ingresada,
      id_repuestos: Id_repuestos,
      id_distribuidor: Id_distribuidor,
      numero_identidad: Numero_identidad
    }).then(() => {
      cerrarmodal();
      toast.success("Entrada actualizada correctamente");
    }).catch((error) => {
      console.error("Error al actualizar entrada: ", error);
      toast.error(error.response?.data?.message || "No se pudo actualizar la entrada");
    });
  };

  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-editar-id">Id Entrada</label>
        <input id="entrada-editar-id" className="form-control" value={Id_entrada} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-editar-fecha">Fecha de entrada</label>
        <input id="entrada-editar-fecha" className="form-control" value={Fecha_entrada} onChange={(event) => { setFecha_entrada(event.target.value); }} type='date'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-editar-cantidad">Cantidad ingresada</label>
        <input id="entrada-editar-cantidad" className="form-control" value={Cantidad_ingresada} onChange={(event) => { setCantidad_ingresada(event.target.value); }} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-editar-repuesto">Repuesto</label>
        <select id="entrada-editar-repuesto" value={Id_repuestos} className="form-control" onChange={(event) => { setId_repuestos(event.target.value); }}>
          <option value=''>seleccione un repuesto</option>
          {repuestos.map((r) => (
            <option key={r.id_repuestos} value={r.id_repuestos}>{r.nombre_repuesto}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-editar-distribuidor">Distribuidor</label>
        <select id="entrada-editar-distribuidor" value={Id_distribuidor} className="form-control" onChange={(event) => { setId_distribuidor(event.target.value); }}>
          <option value=''>seleccione un distribuidor</option>
          {distribuidores.map((d) => (
            <option key={d.id_distribuidor} value={d.id_distribuidor}>{d.nombre_distribuidor}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="entrada-editar-usuario">Usuario responsable</label>
        <select id="entrada-editar-usuario" value={Numero_identidad} className="form-control" onChange={(event) => { setNumero_identidad(event.target.value); }}>
          <option value=''>seleccione un usuario</option>
          {usuarios.map((u) => (
            <option key={u.numero_identidad} value={u.numero_identidad}>{u.nombre} {u.apellido} ({u.numero_identidad})</option>
          ))}
        </select>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar({ id, cerrarmodal }) {
  const eliminar = () => {
    eliminarRecurso({
      url: `http://localhost:3100/api/entradaRepuestos/eliminar/${id}`,
      mensajeExito: "Entrada eliminada",
      mensajeError: "la Entrada no fue eliminada",
      cerrarmodal
    });
  }

  return <ConfirmarEliminar mensaje="seguro que quieres eliminar esta Entrada" onConfirmar={eliminar} />;
}

export { Agregar as AgregarEntradaRepuesto };
export default EntradaRepuestos;
