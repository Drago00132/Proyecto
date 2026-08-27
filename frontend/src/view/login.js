import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Iniciarsesion() {
    const navigate = useNavigate();

    const [paso, setPaso] = useState("credenciales");

    const [form, setForm] = useState({
        usuario: "",
        contrasena: ""
    });

    const [codigo, setCodigo] = useState("");
    const [enviando, setEnviando] = useState(false);

    const handleChange = (e) => {
        setForm ({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const guardarSesionYEntrar = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("numero_identidad", data.numero_identidad);

        toast.success("Inicio de sesión exitoso.");
        navigate("/panel");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.usuario === "" || form.contrasena === "") {
            toast.error("Todos los campos son obligatorios");
            return;
        }

        setEnviando(true);
        try {
            const response = await fetch("http://localhost:3100/api/login/login", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    correo_electronico: form.usuario, 
                    contrasena: form.contrasena
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Error al iniciar sesión");
                return;
            }

            if (data.requiere2FA) {
                toast.info(data.message || "Te enviamos un código de verificación a tu correo.");
                setPaso("codigo");
                return;
            }

            guardarSesionYEntrar(data);

        } catch (error) {
            console.error(error);
            toast.error("Error en el servidor");
        } finally {
            setEnviando(false);
        }
    };

    const handleVerificarCodigo = async (e) => {
        e.preventDefault();

        if (codigo.trim() === "") {
            toast.error("Ingresa el código que te enviamos por correo");
            return;
        }

        setEnviando(true);
        try {
            const response = await fetch("http://localhost:3100/api/login/verificar-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    correo_electronico: form.usuario,
                    codigo: codigo.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "No se pudo verificar el código");
                return;
            }

            guardarSesionYEntrar(data);

        } catch (error) {
            console.error(error);
            toast.error("Error en el servidor");
        } finally {
            setEnviando(false);
        }
    };

    const volverACredenciales = () => {
        setPaso("credenciales");
        setCodigo("");
    };

    return (
        <div className="container-fluid min-vh-100 d-flex aling-items-center bg-light" >
            <div className="container">
                <div className="row aling-items-center">
                    <div className="col-lg-5 col-md-8 mx-auto">
                        <div className="card border-0 shadow-lg p-3 rounded-3" style={{top: '50%'}}>
                            <div className="card-body">

                                {paso === "credenciales" && (
                                    <>
                                        <h2 className="tex-center md.4">Inicio de Sesión</h2>

                                        <form onSubmit={handleSubmit}>
                                            <div className="md-3">
                                                <label className="form-label" htmlFor="login-usuario">Usuario</label>
                                                <input placeholder='usuario' id="login-usuario" className="form-control" type="text" name="usuario" value={form.usuario} onChange={handleChange} />
                                            </div>

                                            <div className="md-3">
                                                <label className="form-label" htmlFor="login-contrasena">Contraseña</label>
                                                <input placeholder='contraseña' id="login-contrasena" className="form-control" type="password" name="contrasena" value={form.contrasena} onChange={handleChange} />
                                            </div>
                                            
                                            <div className="d-grid gap-2" >
                                                <button style={{margin: '20px'}} type="submit" className="btn btn-primary" disabled={enviando}>
                                                    {enviando ? "Verificando..." : "Iniciar sesión"}
                                                </button>
                                            </div>  

                                        </form>

                                        <div className="d-grid gap-2" >
                                            <button type="button" className='btn btn-link' onClick={()=>navigate("/Registarse")}>Registrarse</button>
                                        </div>

                                        <div className="d-grid gap-2" >
                                            <button type="button" className='btn btn-link' onClick={()=>navigate("/recuperar-contrasena")}>¿Olvidaste tu contraseña?</button>
                                        </div> 
                                    </>
                                )}

                                {paso === "codigo" && (
                                    <>
                                        <h2 className="tex-center md.4">Verificación en dos pasos</h2>
                                        <p className="text-muted">
                                            Enviamos un código de 6 dígitos a tu correo. Ingrésalo para completar el inicio de sesión.
                                        </p>

                                        <form onSubmit={handleVerificarCodigo}>
                                            <div className="md-3">
                                                <label className="form-label" htmlFor="login-codigo-verificacion">Código de verificación</label>
                                                <input
                                                    id="login-codigo-verificacion"
                                                    className="form-control"
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={codigo}
                                                    onChange={(e) => setCodigo(e.target.value)}
                                                />
                                            </div>

                                            <div className="d-grid gap-2" >
                                                <button style={{margin: '20px'}} type="submit" className="btn btn-primary" disabled={enviando}>
                                                    {enviando ? "Verificando..." : "Verificar código"}
                                                </button>
                                            </div>
                                        </form>

                                        <div className="d-grid gap-2" >
                                            <button type="button" className='btn btn-link' onClick={volverACredenciales}>Volver a intentar con otro usuario</button>
                                        </div>
                                    </>
                                )}

                                <ToastContainer position="top-right" autoClose={3000} />

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Iniciarsesion;