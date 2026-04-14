import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Iniciarsesion() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        usuario: "",
        contrasena: ""
    });


    const handleChange = (e) => {
        setForm ({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("Datos del formulario:", form);

        if (form.usuario === "" || form.contrasena === "") {
            alert("Todos los campos son obligatorios");
            return;
        }

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
                alert(data.message || "Error al iniciar sesión");
                return;
            }

            localStorage.setItem("token", data.token);

            alert("Inicio de sesión exitoso.");

            navigate("/panel");

        } catch (error) {
            console.error(error);
            alert("Error en el servidor");
        }
    };

    return (
        <div className="container-fluid min-vh-100 d-flex aling-items-center bg-light" >
            <div className="container">
                <div className="row aling-items-center">
                    <div className="col-lg-5 col-md-8 mx-auto">
                        <div className="card border-0 shadow-lg p-3 rounded-3" style={{top: '50%'}}>
                            <div className="card-body">
                                <h2 className="tex-center md.4">Inicio de Sesión</h2>

                                <form onSubmit={handleSubmit}>
                                    <div className="md-3">
                                        <label className="form-label">Usuario</label>
                                        <input className="form-control" type="text" name="usuario" value={form.usuario} onChange={handleChange} />
                                    </div>

                                    <div className="md-3">
                                        <label className="form-label" >Contraseña</label>
                                        <input className="form-control" type="password" name="contrasena" value={form.contrasena} onChange={handleChange} />
                                    </div>
                                    
                                    <div className="d-grid gap-2" >
                                        <button style={{margin: '20px'}} type="submit" className="btn btn-primary" >Iniciar sesión</button>
                                    </div>  

                                </form>

                                <div className="d-grid gap-2" >
                                    <button className='btn btn-link' onClick={()=>navigate("/Registarse")}>Registrarse</button>
                                </div> 

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Iniciarsesion;