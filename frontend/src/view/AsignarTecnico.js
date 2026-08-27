import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AsignarTecnico() {
  const [tecnicos, setTecnicos] = useState([]);
  const [historialesSinAsignar, setHistorialesSinAsignar] = useState([]);
  const [idTecnico, setIdTecnico] = useState("");
  const [idHistorial, setIdHistorial] = useState("");
  const [cargando, setCargando] = useState(true);
  const [asignando, setAsignando] = useState(false);

  const cabecera = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
  });

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      axios.get("http://localhost:3100/api/tecnico/listar?limit=999999", cabecera()),
      axios.get("http://localhost:3100/api/historial/listar?limit=999999", cabecera())
    ]).then(([resTecnicos, resHistorial]) => {
      setTecnicos(resTecnicos.data.tecnico || []);
      const todos = resHistorial.data.historial || [];
      const sinAsignar = todos.filter((h) => !h.id_tecnico && h.estado !== "Finalizado");
      setHistorialesSinAsignar(sinAsignar);
    }).catch((error) => {
      console.error("Error al cargar datos: ", error);
      toast.error(error.response?.data?.message || "No se pudieron cargar los datos");
    }).finally(() => {
      setCargando(false);
    });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const asignar = (event) => {
    event.preventDefault();

    if (!idTecnico || !idHistorial) {
      toast.error("Selecciona un técnico y un historial");
      return;
    }

    setAsignando(true);
    axios.put(`http://localhost:3100/api/historial/actualizar/${idHistorial}`,
      { id_tecnico: idTecnico },
      cabecera()
    ).then(() => {
      toast.success("Técnico asignado correctamente");
      setIdTecnico("");
      setIdHistorial("");
      cargarDatos();
    }).catch((error) => {
      console.error("Error al asignar técnico: ", error);
      toast.error(error.response?.data?.message || "No se pudo asignar el técnico");
    }).finally(() => {
      setAsignando(false);
    });
  };

  if (cargando) {
    return <p>Cargando técnicos e historiales pendientes...</p>;
  }

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />

      {historialesSinAsignar.length === 0 && (
        <p className="text-muted text-center">No hay historiales pendientes de asignar técnico.</p>
      )}

      <form onSubmit={asignar}>
        <div className="mb-3">
          <label className="form-label" htmlFor="asignar-tecnico">Técnico</label>
          <select id="asignar-tecnico" className="form-control" value={idTecnico} onChange={(e) => setIdTecnico(e.target.value)}>
            <option value="">Seleccione un técnico</option>
            {tecnicos.map((tec) => (
              <option key={tec.id_tecnico} value={tec.id_tecnico}>
                {tec.nombre} {tec.apellido} — {tec.reparaciones_asignadas ?? 0} reparaciones asignadas
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="asignar-historial">Servicio sin técnico asignado</label>
          <select id="asignar-historial" className="form-control" value={idHistorial} onChange={(e) => setIdHistorial(e.target.value)} disabled={historialesSinAsignar.length === 0}>
            <option value="">Seleccione un Servicio</option>
            {historialesSinAsignar.map((h) => (
              <option key={h.id_historial} value={h.id_historial}>
                #{h.id_historial} — Placa {h.placa || "s/d"} — {h.nombre_cliente || ""} {h.apellido_cliente || ""}
              </option>
            ))}
          </select>
        </div>

        <div className="d-grid gap-2">
          <button className='btn btn-primary mb-3' type="submit" disabled={asignando || historialesSinAsignar.length === 0}>
            {asignando ? "Asignando..." : "Asignar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AsignarTecnico;