import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DOMINIOS_PERMITIDOS = ['gmail.com', 'hotmail.com', 'outlook.es'];

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
  const [Id_rol] = useState("3");
  const [enviando, setEnviando] = useState(false);

  const calcularEdad = (fechaTexto) => {
    const nacimiento = new Date(fechaTexto);
    if (isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const validarFormulario = () => {
    if (Numero_identidad.trim() === "" || Tipo_documento.trim() === "" || Nombre.trim() === "" ||
        Fecha_nacimiento.trim() === "" || Correo_electronico.trim() === "" || Contrasena.trim() === "") {
      toast.error("Todos los campos obligatorios deben estar diligenciados");
      return false;
    }

    if (!/^\d{10}$/.test(Numero_identidad.trim())) {
      toast.error("El número de identidad debe tener exactamente 10 dígitos, sin espacios ni letras");
      return false;
    }

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!soloLetras.test(Nombre.trim())) {
      toast.error("El nombre no debe contener números ni caracteres especiales");
      return false;
    }
    if (Apellido.trim() !== "" && !soloLetras.test(Apellido.trim())) {
      toast.error("El apellido no debe contener números ni caracteres especiales");
      return false;
    }

    const edad = calcularEdad(Fecha_nacimiento);
    if (edad === null || edad < 18) {
      toast.error("Debes ser mayor de 18 años para registrarte");
      return false;
    }

    if (Numero_celular.trim() !== "" && !/^\d{10}$/.test(Numero_celular.trim())) {
      toast.error("El número de celular debe tener exactamente 10 dígitos");
      return false;
    }

    const correo = Correo_electronico.trim().toLowerCase();
    const dominio = correo.split('@')[1];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || !DOMINIOS_PERMITIDOS.includes(dominio)) {
      toast.error("El correo debe ser válido y de dominio gmail.com, hotmail.com u outlook.es");
      return false;
    }

    if (Contrasena.length < 8 || Contrasena.length > 20) {
      toast.error("La contraseña debe tener entre 8 y 20 caracteres");
      return false;
    }

    return true;
  };

  const add = (event) => {
    event.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);
    axios.post("http://localhost:3100/api/usuarios/registrar-publico", {
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
    .then((res) => {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("rol", res.data.rol);
      localStorage.setItem("numero_identidad", res.data.numero_identidad);

      toast.success(res.data.message || "Registro exitoso");
      navigate("/panel");
    })
    .catch((error) => {
      console.error("Error al registrarse: ", error);
      toast.error(error.response?.data?.message || "No se pudo completar el registro. Intenta más tarde.");
    })
    .finally(() => {
      setEnviando(false);
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
                            <form onSubmit={add}>
                                <div className="mb-3">
                                    <label className="form-label">Numero de identidad</label>
                                    <input className="form-control" value={Numero_identidad} onChange={(event) => {setNumero_identidad(event.target.value);}} type='text' inputMode='numeric'></input>
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
                                    <input className="form-control" value={Numero_celular} onChange={(event) => {setNumero_celular(event.target.value);}} type='text' inputMode='numeric'></input>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input className="form-control" value={Correo_electronico} onChange={(event) => {setCorreo_electrico(event.target.value);}} type='email'></input>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">contraseña</label>
                                    <input className="form-control" value={Contrasena} onChange={(event) => {setContrasena(event.target.value);}} type='password'></input>
                                </div>
                                <button className='btn btn-primary mb-3' type="submit" disabled={enviando}>
                                    {enviando ? "Registrando..." : "Registrarse"}
                                </button>
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