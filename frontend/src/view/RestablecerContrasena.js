import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RestablecerContrasena() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [nuevaContrasena, setNuevaContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");
    const [enviando, setEnviando] = useState(false);

    const longitudValida = nuevaContrasena.length >= 8 && nuevaContrasena.length <= 20;
    const contrasenasCoinciden = nuevaContrasena.length > 0 && nuevaContrasena === confirmarContrasena;
    const puedeEnviar = token !== "" && longitudValida && contrasenasCoinciden && !enviando;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("El enlace no es válido. Solicita uno nuevo.");
            return;
        }

        if (nuevaContrasena.trim() === "" || confirmarContrasena.trim() === "") {
            toast.error("Todos los campos son obligatorios");
            return;
        }

        if (!longitudValida) {
            toast.error("La contraseña debe tener entre 8 y 20 caracteres");
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setEnviando(true);
        try {
            const response = await fetch("http://localhost:3100/api/login/restablecer-contrasena", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    nueva_contrasena: nuevaContrasena,
                    confirmar_contrasena: confirmarContrasena
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "No se pudo restablecer la contraseña");
                setEnviando(false);
                return;
            }

            toast.success(data.message || "Contraseña actualizada correctamente");
            setTimeout(() => navigate("/"), 1500);

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
                                <h2 className="tex-center md.4">Restablecer contraseña</h2>

                                {!token && (
                                    <p className="text-danger">
                                        Este enlace no incluye un token válido. Solicita uno nuevo desde "Recuperar contraseña".
                                    </p>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="md-3">
                                        <label className="form-label">Nueva contraseña</label>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={nuevaContrasena}
                                            onChange={(e) => setNuevaContrasena(e.target.value)}
                                        />
                                    </div>

                                    <div className="md-3">
                                        <label className="form-label">Confirmar contraseña</label>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={confirmarContrasena}
                                            onChange={(e) => setConfirmarContrasena(e.target.value)}
                                        />
                                        {nuevaContrasena && !longitudValida && (
                                            <small className="text-danger">La contraseña debe tener entre 8 y 20 caracteres.</small>
                                        )}
                                        {confirmarContrasena && !contrasenasCoinciden && (
                                            <small className="text-danger d-block">Las contraseñas no coinciden.</small>
                                        )}
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            style={{ margin: '20px' }}
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={!puedeEnviar}
                                        >
                                            {enviando ? "Guardando..." : "Restablecer contraseña"}
                                        </button>
                                    </div>
                                </form>

                                <ToastContainer position="top-right" autoClose={3000} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RestablecerContrasena;