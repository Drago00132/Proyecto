import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RecuperarContrasena() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState("");
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (correo.trim() === "") {
            toast.error("El correo es obligatorio");
            return;
        }

        setEnviando(true);
        try {
            const response = await fetch("http://localhost:3100/api/login/solicitar-recuperacion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo_electronico: correo })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "No se pudo procesar la solicitud");
                setEnviando(false);
                return;
            }

            toast.success(data.message || "Revisa tu correo para continuar");
            setEnviando(false);

        } catch (error) {
            console.error(error);
            toast.error("Error en el servidor");
            setEnviando(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100 d-flex aling-items-center bg-light">
            <div className="container">
                <div className="row aling-items-center">
                    <div className="col-lg-5 col-md-8 mx-auto">
                        <div className="card border-0 shadow-lg p-3 rounded-3">
                            <div className="card-body">
                                <h2 className="tex-center md.4">Recuperar contraseña</h2>
                                <p>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña. El enlace es válido por 15 minutos.</p>

                                <form onSubmit={handleSubmit}>
                                    <div className="md-3">
                                        <label className="form-label" htmlFor="recuperar-correo">Correo electrónico</label>
                                        <input
                                            id="recuperar-correo"
                                            className="form-control"
                                            type="email"
                                            value={correo}
                                            onChange={(e) => setCorreo(e.target.value)}
                                        />
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            style={{ margin: '20px' }}
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={enviando}
                                        >
                                            {enviando ? "Enviando..." : "Enviar enlace"}
                                        </button>
                                    </div>
                                </form>

                                <div className="d-grid gap-2">
                                    <button type="button" className='btn btn-link' onClick={() => navigate("/")}>Volver a iniciar sesión</button>
                                </div>

                                <ToastContainer position="top-right" autoClose={3000} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecuperarContrasena;