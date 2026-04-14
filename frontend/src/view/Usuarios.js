import { useEffect, useState } from 'react';
import axios from 'axios';

function Usuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  //modales y sus funciones 
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setmostrarEliminar] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const buscarUsuario = () =>{
    axios.get(`http://localhost:3100/api/usuarios/consultar/${busqueda}`)
    .then((res) => {
      setUsuarios(Array.isArray(res.data) ? res.data : [res.data]);
    }).catch((err)=>{
      console.error("Error en la busqueda",err);
    });
  };

    const obtenerUsuarios = () => {
      axios.get('http://localhost:3100/api/usuarios/listar').then((res)=>{
        setUsuarios(res.data);
      }).catch((error)=>{
        console.error("Error al mostrar usuarios: ",error);
      });
    };

    const cerrarModal =()=>{
      setMostrarAgregar(false);
      setMostrarEditar(false);
      setmostrarEliminar(false);
      obtenerUsuarios();
    };

    useEffect(()=>{
      obtenerUsuarios();
    },[]);

  return (
    <div className="App">
      <div className="container mt-5"> 
        <div className="card p-4">
          <h2 className="text-center mb-4">Usuarios</h2>

          {/*agregar, buscar y resetear*/}
          <div className="d-flex justify-content-between align-items-center mb-3">
          <button className='btn btn-primary mb-3' 
          onClick={()=> setMostrarAgregar(true)}>Agregar usuarios</button>

            <div className="d-flex">
              <input className="form-control me-2" type='text' placeholder='Buscar por numero de identidad' 
              value={busqueda} onChange={(e)=>
              setBusqueda(e.target.value)}/>
              <button className="btn btn-outline-secondary" onClick={buscarUsuario}>Buscar</button>
              <button className="btn btn-outline-secondary" onClick={obtenerUsuarios}>resetear</button>
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
                  <td><button className="btn btn-success" onClick={()=>{ 
                    setUsuarioSelecionado(usuario);
                    setMostrarEditar(true);}}>
                      Editar</button>
                    <button className="btn btn-danger" onClick={()=>{ 
                    setUsuarioSelecionado(usuario.numero_identidad);
                    setmostrarEliminar(true);}}>
                      Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <button className="btn-close" onClick={()=> setMostrarEditar(false)}></button>
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
                  <button className="btn-close" onClick={()=> setmostrarEliminar(false)}></button>
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

  const add = (event) =>{
    event.preventDefault();

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
    })
    .then(()=>{
      cerrarmodal();
      alert("reguistro Exitoso");
    });
  }


  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Numero de identidad</label>
        <input className="form-control" onChange={(event) => {setNumero_identidad(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label>Tipo de documento</label>
        <select className="form-select" value={Tipo_documento} onChange={(event) => setTipo_documento(event.target.value)}>
          <option value=''>seleccione un tipo de documento</option>
          <option value='Cedula de Ciudadania'>Cedula de Ciudadania</option>
          <option value='Cedula de Extranjeria'>Cedula de Extranjeria</option>
          <option value='Pasaporte'>Pasaporte</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input className="form-control" onChange={(event) => {setNombre(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Apellido</label>
        <input className="form-control" onChange={(event) => {setApellido(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fecha de nacimiento</label>
        <input className="form-control" onChange={(event) => {setFecha_nacimiento(event.target.value);}} type='date'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Numero celular</label>
        <input className="form-control" onChange={(event) => {setNumero_celular(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input className="form-control" onChange={(event) => {setCorreo_electrico(event.target.value);}} type='email'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">contraseña</label>
        <input className="form-control" onChange={(event) => {setContrasena(event.target.value);}} type='password'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Rol</label>
        <select className="form-select" value={Id_rol} onChange={(event) => setId_rol(event.target.value)}>
          <option value=''>seleccione un rol</option>
          <option value='1'>Administrador</option>
          <option value='2'>Tecnico</option>
          <option value='3'>Cliente</option>
        </select>
      </div>
      <button className='btn btn-primary mb-3' onClick={add}>Agregar</button>
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

  useEffect (()=>{
    if(datos){
      setNumero_identidad(datos.numero_identidad || "");
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
    }).then(()=>{
      cerrarmodal();
      alert("Usuarios actualizado correctamente");
    });
  };
  return (
    <form>
      <div className="mb-3">
        <label className="form-label">Numero de identidad</label>
        <input className="form-control" value={Numero_identidad} onChange={(event) => {setNumero_identidad(event.target.value);}} type='number' disabled></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Tipo de documento</label>
        <select className="form-select" value={Tipo_documento} onChange={(event) => setTipo_documento(event.target.value)}>
          <option value=''>seleccione un tipo de documento</option>
          <option value='Cedula de Ciudadania'>Cedula de Ciudadania</option>
          <option value='Cedula de Extranjeria'>Cedula de Extranjeria</option>
          <option value='Pasaporte'>Pasaporte</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input className="form-control" value={Nombre} onChange={(event) => {setNombre(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Apellido</label>
        <input className="form-control" value={Apellido} onChange={(event) => {setApellido(event.target.value);}} type='text'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Fecha de nacimiento</label>
        <input className="form-control" value={Fecha_nacimiento} onChange={(event) => {setFecha_nacimiento(event.target.value);}} type='date'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Numero celular</label>
        <input className="form-control" value={Numero_celular} onChange={(event) => {setNumero_celular(event.target.value);}} type='number'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input className="form-control" value={Correo_electronico} onChange={(event) => {setCorreo_electrico(event.target.value);}} type='email'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">contraseña</label>
        <input className="form-control" value={Contrasena} onChange={(event) => {setContrasena(event.target.value);}} type='password'></input>
      </div>
      <div className="mb-3">
        <label className="form-label">Rol</label>
        <select className="form-select" value={Id_rol} onChange={(event) => setId_rol(event.target.value)}>
          <option value=''>seleccione un rol</option>
          <option value='1'>Administrador</option>
          <option value='2'>Tecnico</option>
          <option value='3'>Cliente</option>
        </select>
      </div>
      <button className='btn btn-primary mb-3' onClick={editar}>Guardar</button>
    </form>
  )
}

function Eliminar ({id, cerrarmodal}){
  const eliminar_usuario = ()=>{
    if(window.confirm("¿seguro que quieres eliminar a este usuario?")){
      axios.delete(`http://localhost:3100/api/usuarios/eliminar/${id}`).then(()=>{
        alert("usuario eliminado");
        cerrarmodal();
      }).catch((error)=>{
        console.error("Error al eliminar: ",error);
        alert("el usuario no fue eliminado");
        cerrarmodal();
      });
    }
  };

  return(
    <div>
      <h5>seguro que quieres eliminar a este usuarios</h5>
      <button className='btn btn-danger mb-3' onClick={eliminar_usuario}>eliminar</button>
    </div>
  )
}

export default Usuario;