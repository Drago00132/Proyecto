import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalOverlay from '../components/ModalOverlay';
import Paginador from '../components/Paginador';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import eliminarRecurso from '../utils/eliminarRecurso';

function Distribuidores() {
  const [Distribuidores, setDistribuidores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [mostrarGestionar, setMostrarGestionar] = useState(false);
  const [DistribuidorSelecionado, setDistribuidorSelecionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarDistribuidor = () => {
    axios.get(`http://localhost:3100/api/distribuidores/consultar/${busqueda}`)
    .then((res) => {
      setDistribuidores(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err) => {
      console.error("Error en la busqueda", err);
    });
  };

  const obtenerDistribuidor = (page = 1) => {
    axios.get(`http://localhost:3100/api/distribuidores/listar?page=${page}&limit=${limite}`).then((res) => {
      setDistribuidores(res.data.distribuidores || []);
      setTotalPaginas(res.data.totalPages || 1);
      setPaginaActual(res.data.currentPage || 1);
    }).catch((error) => {
      console.error("Error al mostrar Distribuidores: ", error);
    });
  };

  const cerrarModal = () => {
    setMostrarAgregar(false);
    setMostrarEditar(false);
    setmostrarEliminar(false);
    setMostrarGestionar(false);
    obtenerDistribuidor(paginaActual);
  };

  useEffect(() => {
    obtenerDistribuidor();
  }, []);

  return (
    <div className="App">
      <div className="container mt-5">
        <div className="card p-4">
          <ToastContainer position="top-right" autoClose={3000} />
          <h2 className="text-center mb-4">Distribuidores</h2>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <button type="button" className='btn btn-primary mb-3'
              onClick={() => setMostrarAgregar(true)}>Agregar Distribuidor</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por id'
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <button type="button" className="btn btn-outline-secondary" onClick={buscarDistribuidor}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerDistribuidor}>resetear</button>
            </div>
          </div>

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Id Distribuidor</th>
                <th scope="col">Nombre</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Correo</th>
                <th scope="col">Dirección</th>
                <th scope="col">Contacto</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {Distribuidores.map((distribuidor, index) => (
                <tr key={index}>
                  <td>{distribuidor.id_distribuidor}</td>
                  <td>{distribuidor.nombre_distribuidor}</td>
                  <td>{distribuidor.telefono}</td>
                  <td>{distribuidor.correo}</td>
                  <td>{distribuidor.direccion}</td>
                  <td>{distribuidor.contacto}</td>
                  <td>
                    <button type="button" className="btn btn-success" onClick={() => {
                      setDistribuidorSelecionado(distribuidor);
                      setMostrarEditar(true);
                    }}>Editar</button>
                    <button type="button" className="btn btn-info" onClick={() => {
                      setDistribuidorSelecionado(distribuidor);
                      setMostrarGestionar(true);
                    }}>Gestionar repuestos</button>
                    <button type="button" className="btn btn-danger" onClick={() => {
                      setDistribuidorSelecionado(distribuidor.id_distribuidor);
                      setmostrarEliminar(true);
                    }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={obtenerDistribuidor} />
        </div>
      </div>

      {mostrarAgregar && (
        <ModalOverlay titulo="Agregar Nuevo Distribuidor" onClose={() => setMostrarAgregar(false)}>
          <Agregar cerrarmodal={cerrarModal} />
        </ModalOverlay>
      )}
      {mostrarEditar && (
        <ModalOverlay titulo="Editar Distribuidor" onClose={() => setMostrarEditar(false)}>
          <Editar cerrarmodal={cerrarModal} datos={DistribuidorSelecionado} />
        </ModalOverlay>
      )}
      {mostrarEliminar && (
        <ModalOverlay titulo="Eliminar Distribuidor" onClose={() => setmostrarEliminar(false)}>
          <Eliminar id={DistribuidorSelecionado} cerrarmodal={cerrarModal} />
        </ModalOverlay>
      )}
      {mostrarGestionar && (
        <ModalOverlay titulo={`Repuestos de ${DistribuidorSelecionado?.nombre_distribuidor}`} onClose={() => setMostrarGestionar(false)}>
          <GestionarRepuestos id={DistribuidorSelecionado?.id_distribuidor} />
        </ModalOverlay>
      )}
    </div>
  );
}

function Agregar({ cerrarmodal }) {
  const [Nombre_distribuidor, setNombre_distribuidor] = useState("");
  const [Telefono, setTelefono] = useState("");
  const [Correo, setCorreo] = useState("");
  const [Direccion, setDireccion] = useState("");
  const [Contacto, setContacto] = useState("");

  const add = (event) => {
    event.preventDefault();

    if (Nombre_distribuidor.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.post("http://localhost:3100/api/distribuidores/agregar", {
      nombre_distribuidor: Nombre_distribuidor,
      telefono: Telefono,
      correo: Correo,
      direccion: Direccion,
      contacto: Contacto
    })
    .then(() => {
      cerrarmodal();
      toast.success("reguistro Exitoso");
    })
    .catch((error) => {
      console.error("Error al agregar distribuidor: ", error);
      toast.error(error.response?.data?.message || "No se pudo registrar el distribuidor");
    });
  }

  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Nombre del distribuidor</label>
        <input id="distribuidor-agregar-nombre" className="form-control" onChange={(event) => { setNombre_distribuidor(event.target.value); }} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Teléfono</label>
        <input id="distribuidor-agregar-telefono" className="form-control" onChange={(event) => { setTelefono(event.target.value); }} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Correo</label>
        <input id="distribuidor-agregar-correo" className="form-control" onChange={(event) => { setCorreo(event.target.value); }} type='email'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Dirección</label>
        <input id="distribuidor-agregar-Direccion" className="form-control" onChange={(event) => { setDireccion(event.target.value); }} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Contacto</label>
        <input id="distribuidor-agregar-contacto" className="form-control" onChange={(event) => { setContacto(event.target.value); }} type='text'></input>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({ datos, cerrarmodal }) {
  const [Id_distribuidor, setId_distribuidor] = useState("");
  const [Nombre_distribuidor, setNombre_distribuidor] = useState("");
  const [Telefono, setTelefono] = useState("");
  const [Correo, setCorreo] = useState("");
  const [Direccion, setDireccion] = useState("");
  const [Contacto, setContacto] = useState("");

  useEffect(() => {
    if (datos) {
      setId_distribuidor(datos.id_distribuidor || "");
      setNombre_distribuidor(datos.nombre_distribuidor || "");
      setTelefono(datos.telefono || "");
      setCorreo(datos.correo || "");
      setDireccion(datos.direccion || "");
      setContacto(datos.contacto || "");
    }
  }, [datos]);

  const editar = (event) => {
    event.preventDefault();

    if (Nombre_distribuidor.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    axios.put(`http://localhost:3100/api/distribuidores/actualizar/${datos.id_distribuidor}`, {
      nombre_distribuidor: Nombre_distribuidor,
      telefono: Telefono,
      correo: Correo,
      direccion: Direccion,
      contacto: Contacto
    }).then(() => {
      cerrarmodal();
      toast.success("Distribuidor actualizado correctamente");
    }).catch((error) => {
      console.error("Error al actualizar distribuidor: ", error);
      toast.error(error.response?.data?.message || "No se pudo actualizar el distribuidor");
    });
  };

  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Id Distribuidor</label>
        <input className="form-control" value={Id_distribuidor} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre del distribuidor</label>
        <input id="distribuidor-editar-nombre" className="form-control" value={Nombre_distribuidor} onChange={(event) => { setNombre_distribuidor(event.target.value); }} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Teléfono</label>
        <input id="distribuidor-editar-telefono" className="form-control" value={Telefono} onChange={(event) => { setTelefono(event.target.value); }} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Correo</label>
        <input id="distribuidor-editar-correo" className="form-control" value={Correo} onChange={(event) => { setCorreo(event.target.value); }} type='email'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Dirección</label>
        <input id="distribuidor-editar-direccion" className="form-control" value={Direccion} onChange={(event) => { setDireccion(event.target.value); }} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Contacto</label>
        <input id="distribuidor-editar-contacto" className="form-control" value={Contacto} onChange={(event) => { setContacto(event.target.value); }} type='text'></input>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar({ id, cerrarmodal }) {
  const eliminar = () => {
    eliminarRecurso({
      url: `http://localhost:3100/api/distribuidores/eliminar/${id}`,
      mensajeExito: "Distribuidor eliminado",
      mensajeError: "el Distribuidor no fue eliminado",
      cerrarmodal
    });
  }

  return <ConfirmarEliminar mensaje="seguro que quieres eliminar este Distribuidor" onConfirmar={eliminar} />;
}

function GestionarRepuestos({ id }) {
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:3100/api/repuestoDistribuidor/consultar/${id}`)
        .then((res) => {
          setRepuestos(res.data.relaciones || []);
          setCargando(false);
        })
        .catch((error) => {
          console.error("Error al mostrar repuestos del distribuidor: ", error);
          setCargando(false);
        });
    }
  }, [id]);

  if (cargando) {
    return <p>Cargando...</p>;
  }

  if (repuestos.length === 0) {
    return <p>Este distribuidor no tiene repuestos asociados.</p>;
  }

  return (
    <table className="table table-hover">
      <thead className="table-dark">
        <tr>
          <th scope="col">Id Repuesto</th>
          <th scope="col">Nombre</th>
        </tr>
      </thead>
      <tbody>
        {repuestos.map((r, index) => (
          <tr key={index}>
            <td>{r.id_repuestos}</td>
            <td>{r.nombre_repuesto}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Distribuidores;
