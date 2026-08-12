function Paginador({ paginaActual, totalPaginas, onCambiarPagina }) {
  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <button
        type="button"
        className="btn btn-outline-primary"
        disabled={paginaActual === 1}
        onClick={() => onCambiarPagina(paginaActual - 1)}
      >
        Anterior
      </button>

      <span className="fw-bold">
        Página {paginaActual} de {totalPaginas}
      </span>

      <button
        type="button"
        className="btn btn-outline-primary"
        disabled={paginaActual === totalPaginas}
        onClick={() => onCambiarPagina(paginaActual + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}

export default Paginador;
