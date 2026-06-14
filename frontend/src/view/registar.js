import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Registrarse(){
  const navigate = useNavigate();

  const [Numero_identidad, setNumero_identidad] = useState("");
  const [Tipo_documento, setTipo_documento] = useState("");
  const [Nombre, setNombre] = useState("");
  const [Apellido, setApellido] = useState("");
  const [Fecha_nacimiento, setFecha_nacimiento] = useState("");
  const [Numero_celular, setNumero_celular] = useState("");
  const [Correo_electronico, setCorreo_electrico] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [Id_rol, setId_rol] = useState("3");

  const add = (event) =>{
    event.preventDefault();

    if (Numero_identidad.trim() === "" || Tipo_documento.trim() === "" || Nombre.trim() === "" || Fecha_nacimiento.trim() === "" || Correo_electronico.trim() === "" || Contrasena.trim() === "") {
      toast.error("Faltan datos obligatorio");
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
    })
    .then(()=>{
        navigate("/panel")
      toast.success("reguistro Exitoso");
    });
  }


  return (

    <div className="container-fluid min-vh-100 d-flex aling-items-center bg-light" >
        <div className="container">
            <div className="row aling-items-center">
                <div className="col-lg-5 col-md-8 mx-auto">
                    <div className="card border-0 shadow-lg p-3 rounded-3" >
                        <div className="card-body">

                            <ToastContainer position="top-right" autoClose={3000} />
                            
                            <h2 className="tex-center md.4">Registarse</h2>
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
                                <button className='btn btn-primary mb-3' onClick={add}>Registrarse</button>
                            </form>
                            <button className='btn btn-link' onClick={()=>navigate("/")}>Iniciar sesion</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
export default Registrarse;