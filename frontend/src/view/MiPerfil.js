import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MiPerfil() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [numeroIdentidad, setNumeroIdentidad] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");

  const cargarPerfil = () => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:3100/api/usuarios/mi-perfil", {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      const u = res.data;
      setNumeroIdentidad(u.numero_identidad || "");
      setTipoDocumento(u.tipo_documento || "");
      setFechaNacimiento(u.fecha_nacimiento ? String(u.fecha_nacimiento).split('T')[0] : "");
      setRol(u.id_rol || "");
      setNombre(u.nombre || "");
      setApellido(u.apellido || "");
      setCorreo(u.correo_electronico || "");
      setCelular(u.numero_celular || "");
    }).catch((error) => {
      console.error("Error al cargar el perfil: ", error);
      toast.error(error.response?.data?.message || "No se pudo cargar tu perfil");
    }).finally(() => {
      setCargando(false);
    });
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const guardar = (event) => {
    event.preventDefault();

    if (nombre.trim() === "" || correo.trim() === "") {
      toast.error("Nombre y correo son obligatorios");
      return;
    }

    setGuardando(true);
    const token = localStorage.getItem("token");
    axios.put("http://localhost:3100/api/usuarios/mi-perfil", {
      nombre,
      apellido,
      correo_electronico: correo,
      numero_celular: celular
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      toast.success(res.data?.message || "Perfil actualizado correctamente");
    }).catch((error) => {
      console.error("Error al actualizar el perfil: ", error);
      toast.error(error.response?.data?.message || "No se pudo actualizar tu perfil");
    }).finally(() => {
      setGuardando(false);
    });
  };

  if (cargando) {
    return (
      <div className="container mt-5">
        <p>Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container mt-5">
        <div className="card p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <ToastContainer position="top-right" autoClose={3000} />
          <h2 className="text-center mb-4">Mi perfil</h2>

          <p className="text-muted">
            Los siguientes datos son informativos y solo el Administrador o Super Administrador pueden modificarlos.
          </p>

          <div className="mb-3">
            <label className="form-label" htmlFor="miperfil-identidad">Número de identidad</label>
            <input id="miperfil-identidad" className="form-control" value={numeroIdentidad} type='text' disabled />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="miperfil-tipo-documento">Tipo de documento</label>
            <input id="miperfil-tipo-documento" className="form-control" value={tipoDocumento} type='text' disabled />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="miperfil-fecha-nacimiento">Fecha de nacimiento</label>
            <input id="miperfil-fecha-nacimiento" className="form-control" value={fechaNacimiento} type='date' disabled />
          </div>

          <hr />
          <p className="text-muted">Estos campos sí puedes editarlos:</p>

          <form onSubmit={guardar}>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-nombre">Nombre</label>
              <input id="miperfil-nombre" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} type='text' />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-apellido">Apellido</label>
              <input id="miperfil-apellido" className="form-control" value={apellido} onChange={(e) => setApellido(e.target.value)} type='text' />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-correo">Correo electrónico</label>
              <input id="miperfil-correo" className="form-control" value={correo} onChange={(e) => setCorreo(e.target.value)} type='email' required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-celular">Número celular</label>
              <input id="miperfil-celular" className="form-control" value={celular} onChange={(e) => setCelular(e.target.value)} type='text' />
            </div>

            <div className="d-grid gap-2">
              <button className='btn btn-primary mb-3' type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MiPerfil;