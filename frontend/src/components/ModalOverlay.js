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
      zIndex: 1000
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
