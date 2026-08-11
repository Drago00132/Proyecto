import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Usuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  //paginador 
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 5;

  const buscarUsuario = () =>{
    axios.get(`http://localhost:3100/api/usuarios/consultar/${busqueda}`)
    .then((res) => {
      setUsuarios(Array.isArray(res.data) ? res.data : [res.data]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

  const obtenerUsuarios = (page = 1) => {
  const pagina = typeof page === 'number' ? page : 1;

  axios.get(`http://localhost:3100/api/usuarios/listar?page=${pagina}&limit=${limite}`)
    .then((res) => {
      setUsuarios(res.data.usuarios || []);
      setTotalPaginas(res.data.totalPages || 1);
      setPaginaActual(res.data.currentPage || 1);
    })
    .catch((error) => {
      console.error("Error al mostrar usuarios: ", error);
    });
  };

    const cerrarModal =()=>{
      setMostrarAgregar(false);
      setMostrarEditar(false);
      setmostrarEliminar(false);
      obtenerUsuarios(paginaActual);
    };

    useEffect(()=>{
      obtenerUsuarios();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <ToastContainer position="top-right" autoClose={3000} />
          <h2 className="text-center mb-4">Usuarios</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button type="button" className='btn btn-primary mb-3'
          onClick={()=> setMostrarAgregar(true)}>Agregar usuarios</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad' 
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button type="button" className="btn btn-outline-secondary" onClick={buscarUsuario}>Buscar</button>
              <button type="button" className="btn btn-outline-secondary" onClick={obtenerUsuarios}>resetear</button>
            </div>
          </div>

          {/* tabal de usuarios*/}

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Numero de identidad</th>
                <th scope="col">Nombre</th>
                <th scope="col">Apellido</th>
                <th scope="col">Fecha de nacimiento</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Email</th>
                <th scope="col">Aciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={index}> 
                  <td>{usuario.numero_identidad}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.apellido}</td>
                  <td>{usuario.fecha_nacimiento}</td>
                  <td>{usuario.numero_celular}</td>
                  <td>{usuario.correo_electronico}</td>
                  <td><button type="button" className="btn btn-success" onClick={()=>{
                    setUsuarioSelecionado(usuario);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button type="button" className="btn btn-danger" onClick={()=>{
                    setUsuarioSelecionado(usuario.numero_identidad);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={paginaActual === 1}
              onClick={() => {
                const paginaAnterior = paginaActual - 1;
                obtenerUsuarios(paginaAnterior);
              }}
            >
              Anterior
            </button>

            <span className="fw-bold">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={paginaActual === totalPaginas}
              onClick={() => {
                const paginaSiguiente = paginaActual + 1;
                obtenerUsuarios(paginaSiguiente);
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
                  <h5 className="modal-title">Agregar Nuevo Usuario </h5>
                  <button type="button" className="btn-close" onClick={()=> setMostrarAgregar(false)}></button>
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
                  <h5 className="modal-title">Editar un Usuario</h5>
                  <button type="button" className="btn-close" onClick={()=> setMostrarEditar(false)}></button>
                </div>
                <div className="modal-body">
                  <Editar cerrarmodal={cerrarModal} datos={usuarioSelecionado}/>
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
                  <h5 className="modal-title">Eliminar a un Usuario </h5>
                  <button type="button" className="btn-close" onClick={()=> setmostrarEliminar(false)}></button>
                </div>
                <div className="modal-body">
                  <Eliminar id={usuarioSelecionado} cerrarmodal={cerrarModal}/>
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
  const [Tipo_documento, setTipo_documento] = useState("");
  const [Nombre, setNombre] = useState("");
  const [Apellido, setApellido] = useState("");
  const [Fecha_nacimiento, setFecha_nacimiento] = useState("");
  const [Numero_celular, setNumero_celular] = useState("");
  const [Correo_electronico, setCorreo_electrico] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [Id_rol, setId_rol] = useState("");
  const [roles, setRoles] = useState([]);

  const add = (event) =>{
    event.preventDefault();

    if (Numero_identidad.trim() === "" || Tipo_documento.trim() === "" || Nombre.trim() === "" || Fecha_nacimiento.trim() === "" || Correo_electronico.trim() === "" || Contrasena.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    const validarFormulario = () => {

    const fechaNacimiento = new Date(Fecha_nacimiento);
    const hoy = new Date();
    
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesDiferencia = hoy.getMonth() - fechaNacimiento.getMonth();

    if (mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    if (edad < 18) {
      toast.error("El usuario debe ser mayor de 18 años.");
      return false;
    }

    if (Contrasena.length < 8 || Contrasena.length > 20) {
      toast.error("La contraseña debe tener entre 8 y 20 caracteres.");
      return false;
    }

    if (Numero_identidad.length< 10 || Numero_identidad.length > 10) {
      toast.error("El numero de identidad debe tener 10 caracteres.");
      return false;
    }

    if (Numero_celular.length< 10 || Numero_celular.length > 10) {
      toast.error("El numero de celular debe tener 10 caracteres.");
      return false;
    }

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!soloLetras.test(Nombre)) {
      toast.error("El nombre no debe contener números ni caracteres especiales.");
      return false;
    }

    if (!soloLetras.test(Apellido)) {
      toast.error("El apellido no debe contener números ni caracteres especiales.");
      return false;
    }

    const regexCorreo = /^[a-zA-Z0-9._%+-]+@(gmail|hotmail|outlook)\.(com|es)$/;
    if (!regexCorreo.test(Correo_electronico)) {
      toast.error("El correo debe ser de @gmail.com, @hotmail.com, @outlook.com o sus versiones .es");
      return false;
    }
    return true;
    };

    if (!validarFormulario()) {
    return; 
    }

    axios.post("http://localhost:3100/api/usuarios/agregar",{
      numero_identidad: Numero_identidad,
      tipo_documento: Tipo_documento,
      nombre: Nombre,
      apellido: Apellido,
      fecha_nacimiento: Fecha_nacimiento,
      numero_celular: Numero_celular,
      correo_electronico: Correo_electronico,
      contrasena: Contrasena,
      id_rol: Id_rol
    }, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then(()=>{
      cerrarmodal();
      toast.success("reguistro Exitoso");
    })
    .catch((error)=>{
      console.error("Error al agregar: ", error);
      toast.error(error.response?.data?.message || "No se pudo crear el usuario");
    });
  }

  useEffect(()=>{
    axios.get("http://localhost:3100/api/usuarios/roles-asignables", {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then((res)=>{
      setRoles(res.data.roles || []);
    })
    .catch((error)=>{
      console.error("error al obtener los roles ",error);
      toast.error("No se pudieron cargar los roles disponibles");
    });
  }, []);


  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-identidad">Numero de identidad</label>
        <input id="usuario-agregar-identidad" className="form-control" onChange={(event) => {setNumero_identidad(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label htmlFor="usuario-agregar-tipo-documento">Tipo de documento</label>
        <select id="usuario-agregar-tipo-documento" className="form-select" value={Tipo_documento} onChange={(event) => setTipo_documento(event.target.value)}>
          <option value=''>seleccione un tipo de documento</option>
          <option value='Cedula de Ciudadania'>Cedula de Ciudadania</option>
          <option value='Cedula de Extranjeria'>Cedula de Extranjeria</option>
          <option value='Pasaporte'>Pasaporte</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-nombre">Nombre</label>
        <input id="usuario-agregar-nombre" className="form-control" onChange={(event) => {setNombre(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-apellido">Apellido</label>
        <input id="usuario-agregar-apellido" className="form-control" onChange={(event) => {setApellido(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-fecha-nacimiento">Fecha de nacimiento</label>
        <input id="usuario-agregar-fecha-nacimiento" className="form-control" onChange={(event) => {setFecha_nacimiento(event.target.value);}} type='date'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-celular">Numero celular</label>
        <input id="usuario-agregar-celular" className="form-control" onChange={(event) => {setNumero_celular(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-email">Email</label>
        <input id="usuario-agregar-email" className="form-control" onChange={(event) => {setCorreo_electrico(event.target.value);}} type='email'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-contrasena">contraseña</label>
        <input id="usuario-agregar-contrasena" className="form-control" onChange={(event) => {setContrasena(event.target.value);}} type='password'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-agregar-rol">Rol</label>
        <select id="usuario-agregar-rol" className="form-select" value={Id_rol} onChange={(event) => setId_rol(event.target.value)}>
          <option value=''>seleccione un rol</option>
          {roles.map((r) => (
          <option value={r.id_rol}>
            {r.rol}
          </option>
        ))}
        </select>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={add}>Agregar</button>
    </form>
  )
}

function Editar({datos,cerrarmodal}){

  const [Numero_identidad, setNumero_identidad] = useState("");
  const [Tipo_documento, setTipo_documento] = useState("");
  const [Nombre, setNombre] = useState("");
  const [Apellido, setApellido] = useState("");
  const [Fecha_nacimiento, setFecha_nacimiento] = useState("");
  const [Numero_celular, setNumero_celular] = useState("");
  const [Correo_electronico, setCorreo_electrico] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [Id_rol, setId_rol] = useState("");
  const [roles, setRoles] = useState([]);

  useEffect (()=>{
    if(datos){
      setNumero_identidad(String(datos.numero_identidad ?? ""));
      setTipo_documento(datos.tipo_documento || "");
      setNombre(datos.nombre || "");
      setApellido(datos.apellido || "");
      setFecha_nacimiento(datos.fecha_nacimiento.split('T')[0] || "");
      setNumero_celular(datos.numero_celular || "");
      setCorreo_electrico(datos.correo_electronico || "");
      setContrasena(datos.contrasena || "");
      setId_rol(datos.id_rol || "");
    }
  },[datos]);

  const editar= (event)=>{
    event.preventDefault();

    if (Numero_identidad.trim() === "" || Tipo_documento.trim() === "" || Nombre.trim() === "" || Fecha_nacimiento.trim() === "" || Correo_electronico.trim() === "" || Contrasena.trim() === "") {
      toast.error("Faltan datos obligatorio");
      return;
    }

    const validarFormulario = () => {

    const fechaNacimiento = new Date(Fecha_nacimiento);
    const hoy = new Date();
    
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesDiferencia = hoy.getMonth() - fechaNacimiento.getMonth();

    if (mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    if (edad < 18) {
      toast.error("El usuario debe ser mayor de 18 años.");
      return false;
    }

    if (Contrasena.length < 8 || Contrasena.length > 20) {
      toast.error("La contraseña debe tener entre 8 y 20 caracteres.");
      return false;
    }

    if (Numero_identidad.length< 10 || Numero_identidad.length > 10) {
      toast.error("El numero de identidad debe tener 10 caracteres.");
      return false;
    }

    if (Numero_celular.length< 10 || Numero_celular.length > 10) {
      toast.error("El numero de celular debe tener 10 caracteres.");
      return false;
    }

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!soloLetras.test(Nombre)) {
      toast.error("El nombre no debe contener números ni caracteres especiales.");
      return false;
    }

    if (!soloLetras.test(Apellido)) {
      toast.error("El apellido no debe contener números ni caracteres especiales.");
      return false;
    }

    const regexCorreo = /^[a-zA-Z0-9._%+-]+@(gmail|hotmail|outlook)\.(com|es)$/;
    if (!regexCorreo.test(Correo_electronico)) {
      toast.error("El correo debe ser de @gmail.com, @hotmail.com, @outlook.com o sus versiones .es");
      return false;
    }
    return true;
    };

    if (!validarFormulario()) {
    return; 
    }

    axios.put(`http://localhost:3100/api/usuarios/actualizar/${datos.numero_identidad}`,{
      numero_identidad:Numero_identidad,
      tipo_documento: Tipo_documento,
      nombre: Nombre,
      apellido: Apellido,
      fecha_nacimiento: Fecha_nacimiento,
      numero_celular: Numero_celular,
      correo_electronico: Correo_electronico,
      contrasena: Contrasena,
      id_rol: Id_rol
    }, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    }).then(()=>{
      cerrarmodal();
      toast.success("Usuarios actualizado correctamente");
    }).catch((error)=>{
      console.error("Error al actualizar: ", error);
      toast.error(error.response?.data?.message || "No se pudo actualizar el usuario");
    });
  };

  useEffect(()=>{
    axios.get("http://localhost:3100/api/usuarios/roles-asignables", {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then((res)=>{
      setRoles(res.data.roles || []);
    })
    .catch((error)=>{
      console.error("error al obtener los roles ",error);
      toast.error("No se pudieron cargar los roles disponibles");
    });
  }, []);

  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-identidad">Numero de identidad</label>
        <input id="usuario-editar-identidad" className="form-control" value={Numero_identidad} onChange={(event) => {setNumero_identidad(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-tipo-documento">Tipo de documento</label>
        <select id="usuario-editar-tipo-documento" className="form-select" value={Tipo_documento} onChange={(event) => setTipo_documento(event.target.value)}>
          <option value=''>seleccione un tipo de documento</option>
          <option value='Cedula de Ciudadania'>Cedula de Ciudadania</option>
          <option value='Cedula de Extranjeria'>Cedula de Extranjeria</option>
          <option value='Pasaporte'>Pasaporte</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-nombre">Nombre</label>
        <input id="usuario-editar-nombre" className="form-control" value={Nombre} onChange={(event) => {setNombre(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-apellido">Apellido</label>
        <input id="usuario-editar-apellido" className="form-control" value={Apellido} onChange={(event) => {setApellido(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-fecha-nacimiento">Fecha de nacimiento</label>
        <input id="usuario-editar-fecha-nacimiento" className="form-control" value={Fecha_nacimiento} onChange={(event) => {setFecha_nacimiento(event.target.value);}} type='date'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-celular">Numero celular</label>
        <input id="usuario-editar-celular" className="form-control" value={Numero_celular} onChange={(event) => {setNumero_celular(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-email">Email</label>
        <input id="usuario-editar-email" className="form-control" value={Correo_electronico} onChange={(event) => {setCorreo_electrico(event.target.value);}} type='email'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-contrasena">contraseña</label>
        <input id="usuario-editar-contrasena" className="form-control" value={Contrasena} onChange={(event) => {setContrasena(event.target.value);}} type='password'></input>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="usuario-editar-rol">Rol</label>
        <select id="usuario-editar-rol" className="form-select" value={Id_rol} onChange={(event) => setId_rol(event.target.value)}>
          <option value=''>seleccione un rol</option>
          {roles.map((r) => (
          <option value={r.id_rol}>
            {r.rol}
          </option>
        ))}
        </select>
      </div>
      <button type="button" className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_usuario = ()=>{
      axios.delete(`http://localhost:3100/api/usuarios/eliminar/${id}`).then(()=>{
        toast.success("usuario eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        toast.error("el usuario no fue eliminado");
        cerrarmodal();
      });
    }

  return(
    <div>
      <h5>seguro que quieres eliminar a este usuarios</h5>
      <button type="button" className='btn btn-danger mb-3' onClick={eliminar_usuario}>eliminar</button>
    </div>
  )
}

export default Usuario;