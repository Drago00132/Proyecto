import { useEffect, useState } from 'react';
import axios from 'axios';
import Paginador from '../components/Paginador';

function AuditoriaRepuestos() {
  const [auditoria, setAuditoria] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const limite = 10;

  useEffect(() => {
    axios.get('http://localhost:3100/api/repuestos/auditoria')
      .then((res) => setAuditoria(res.data.auditoria || []))
      .catch((error) => console.error('Error al cargar la auditoría: ', error));
  }, []);

  const totalPaginas = Math.ceil(auditoria.length / limite) || 1;
  const registrosPagina = auditoria.slice((paginaActual - 1) * limite, paginaActual * limite);

  const colorAccion = (accion) => {
    if (accion === 'CREAR') return 'success';
    if (accion === 'EDITAR') return 'warning';
    if (accion === 'ELIMINAR') return 'danger';
    return 'secondary';
  };

  return (
    <div className="App">
      <div className="container mt-5">
        <div className="card p-4">
          <h2 className="text-center mb-4">Auditoría de Repuestos</h2>

          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>Repuesto</th>
                <th>Acción</th>
                <th>Usuario responsable</th>
                <th>Fecha</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registrosPagina.map((registro) => (
                <tr key={registro.id_auditoria}>
                  <td>{registro.nombre_repuesto}</td>
                  <td><span className={`badge bg-${colorAccion(registro.accion)}`}>{registro.accion}</span></td>
                  <td>{registro.nombre? `${registro.nombre} ${registro.apellido || ''} (${registro.nombre_rol || 'sin rol'})`: `${registro.usuario_responsable} (usuario eliminado)`}</td>
                  <td>{new Date(registro.fecha).toLocaleString()}</td>
                  <td>{registro.detalle || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {auditoria.length === 0 && <p className="text-muted text-center">No hay registros de auditoría todavía.</p>}

          <Paginador paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={setPaginaActual} />
        </div>
      </div>
    </div>
  );
}

export default AuditoriaRepuestos;