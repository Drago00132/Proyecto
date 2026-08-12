function ConfirmarEliminar({ mensaje, onConfirmar }) {
  return (
    <div>
      <h5>{mensaje}</h5>
      <button type="button" className="btn btn-danger mb-3" onClick={onConfirmar}>eliminar</button>
    </div>
  );
}

export default ConfirmarEliminar;
