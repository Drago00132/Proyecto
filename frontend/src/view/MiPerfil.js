import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSesion } from '../components/Sesion';

// Administrador (1) y Súper Administrador (17) pueden editar también su
// documento, tipo de documento y fecha de nacimiento. Los demás roles los ven
// solo como información (el backend aplica la misma regla).
const ROLES_EDITAN_DATOS_PERSONALES = [1, 17];
const TIPOS_DOCUMENTO = ['Cedula de Ciudadania', 'Cedula de Extranjeria', 'Pasaporte'];

function MiPerfil() {
  const { rol, recargarSesion } = useSesion();
  const puedeEditarDatosPersonales = ROLES_EDITAN_DATOS_PERSONALES.includes(rol);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [numeroIdentidad, setNumeroIdentidad] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");

  const cargarPerfil = () => {
    const token = localStorage.getItem("token");
    axios.get("/api/usuarios/mi-perfil", {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      const u = res.data;
      setNumeroIdentidad(u.numero_identidad != null ? String(u.numero_identidad) : "");
      setTipoDocumento(u.tipo_documento || "");
      setFechaNacimiento(u.fecha_nacimiento ? String(u.fecha_nacimiento).split('T')[0] : "");
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

    // Mismas reglas que validarUsuario() en Usuarios.js y CuentaFragment.kt
    // (móvil): nombre/apellido solo letras, celular opcional pero, si se
    // diligencia, exactamente 10 dígitos. Antes Mi Perfil no validaba nada de
    // esto, a diferencia de esos otros dos formularios.
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!soloLetras.test(nombre)) {
      toast.error("El nombre no debe contener números ni caracteres especiales.");
      return;
    }

    if (apellido.trim() !== "" && !soloLetras.test(apellido)) {
      toast.error("El apellido no debe contener números ni caracteres especiales.");
      return;
    }

    if (String(celular).trim() !== "" && !/^\d{10}$/.test(celular)) {
      toast.error("El numero de celular debe tener exactamente 10 dígitos.");
      return;
    }

    // Mismas reglas que validarUsuario() en Usuarios.js para estos campos.
    if (puedeEditarDatosPersonales) {
      if (!/^\d{10}$/.test(numeroIdentidad)) {
        toast.error("El numero de identidad debe tener exactamente 10 dígitos.");
        return;
      }

      if (!TIPOS_DOCUMENTO.includes(tipoDocumento)) {
        toast.error("Selecciona un tipo de documento.");
        return;
      }

      if (fechaNacimiento === "") {
        toast.error("La fecha de nacimiento es obligatoria.");
        return;
      }

      const nacimiento = new Date(fechaNacimiento + "T00:00:00");
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mesDiferencia = hoy.getMonth() - nacimiento.getMonth();
      if (mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      if (edad < 18) {
        toast.error("El usuario debe ser mayor de 18 años.");
        return;
      }
    }

    const datos = {
      nombre,
      apellido,
      correo_electronico: correo,
      numero_celular: celular
    };

    if (puedeEditarDatosPersonales) {
      datos.numero_identidad = numeroIdentidad;
      datos.tipo_documento = tipoDocumento;
      datos.fecha_nacimiento = fechaNacimiento;
    }

    setGuardando(true);
    const token = localStorage.getItem("token");
    axios.put("/api/usuarios/mi-perfil", datos, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      // Si cambió el número de identidad, el backend manda un token nuevo
      // (el anterior quedó con el número viejo). Se guarda para seguir en
      // sesión sin tener que volver a entrar.
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      // Actualiza el nombre y el número de identidad que usa el resto del panel.
      recargarSesion();
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
          <h2 className="text-center mb-4">Mi perfil</h2>

          <form onSubmit={guardar}>
            {puedeEditarDatosPersonales ? (
              <p className="text-muted">Como {rol === 17 ? "Súper Administrador" : "Administrador"} puedes editar todos tus datos.</p>
            ) : (
              <p className="text-muted">
                Los siguientes datos son informativos y solo el Administrador o Super Administrador pueden modificarlos.
              </p>
            )}

            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-identidad">Número de identidad</label>
              <input
                id="miperfil-identidad"
                className="form-control"
                value={numeroIdentidad}
                onChange={(e) => setNumeroIdentidad(e.target.value)}
                type='text'
                inputMode='numeric'
                maxLength={10}
                disabled={!puedeEditarDatosPersonales}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-tipo-documento">Tipo de documento</label>
              {puedeEditarDatosPersonales ? (
                <select id="miperfil-tipo-documento" className="form-select" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}>
                  <option value=''>seleccione un tipo de documento</option>
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              ) : (
                <input id="miperfil-tipo-documento" className="form-control" value={tipoDocumento} type='text' disabled />
              )}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-fecha-nacimiento">Fecha de nacimiento</label>
              <input
                id="miperfil-fecha-nacimiento"
                className="form-control"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                type='date'
                disabled={!puedeEditarDatosPersonales}
              />
            </div>

            <hr />
            {!puedeEditarDatosPersonales && (
              <p className="text-muted">Estos campos sí puedes editarlos:</p>
            )}

            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-nombre">Nombre</label>
              <input id="miperfil-nombre" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} type='text' maxLength={50} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-apellido">Apellido</label>
              <input id="miperfil-apellido" className="form-control" value={apellido} onChange={(e) => setApellido(e.target.value)} type='text' maxLength={50} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-correo">Correo electrónico</label>
              <input id="miperfil-correo" className="form-control" value={correo} onChange={(e) => setCorreo(e.target.value)} type='email' maxLength={100} required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="miperfil-celular">Número celular</label>
              <input id="miperfil-celular" className="form-control" value={celular} onChange={(e) => setCelular(e.target.value)} type='text' inputMode='numeric' maxLength={10} />
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