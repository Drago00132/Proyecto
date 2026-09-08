function ModalOverlay({ titulo, onClose, children, large = false, headerClassName = '' }) {
  const esHeaderClaro = headerClassName.includes('text-white');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      // Por encima de la barra superior, el sidebar y la barra de botones
      // fijos en móvil (.sigat-topbar 1040, .sigat-sidebar-backdrop 1045,
      // .sigat-sidebar y .sigat-barra-acciones 1050 en theme.css), para que
      // el modal siempre se vea completo y no quede tapado por ellos.
      zIndex: 1100
    }}>
      <div className="modal d-block">
        <div className={`modal-dialog${large ? ' modal-lg' : ''}`}>
          <div className="modal-content">
            <div className={`modal-header${headerClassName ? ' ' + headerClassName : ''}`}>
              <h5 className="modal-title">{titulo}</h5>
              <button
                type="button"
                className={`btn-close${esHeaderClaro ? ' btn-close-white' : ''}`}
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalOverlay;
