import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// RNF-4: cierre automático de sesión tras 15 minutos de inactividad, con
// una advertencia 1 minuto antes del cierre que permite extender la sesión.
// No existía ningún temporizador de inactividad en el frontend; se
// implementa por completo aquí y se monta dentro de Dashboard.js, que es
// el layout exclusivo de las rutas ya autenticadas (/panel/*).
const TIEMPO_AVISO_MS = 14 * 60 * 1000; // 14 min: aparece el aviso (1 min antes del cierre)
const TIEMPO_CIERRE_MS = 15 * 60 * 1000; // 15 min: cierre automático de sesión
const DURACION_CUENTA_REGRESIVA_S = 60;

function InactividadTimer() {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(DURACION_CUENTA_REGRESIVA_S);
  const navigate = useNavigate();

  const mostrarAvisoRef = useRef(false);
  const timerAvisoRef = useRef(null);
  const timerCierreRef = useRef(null);
  const intervaloRef = useRef(null);

  const limpiarTimers = () => {
    if (timerAvisoRef.current) clearTimeout(timerAvisoRef.current);
    if (timerCierreRef.current) clearTimeout(timerCierreRef.current);
    if (intervaloRef.current) clearInterval(intervaloRef.current);
  };

  const cerrarSesion = useCallback(() => {
    limpiarTimers();
    localStorage.clear();
    navigate("/");
  }, [navigate]);

  const iniciarTemporizadores = useCallback(() => {
    limpiarTimers();
    mostrarAvisoRef.current = false;
    setMostrarAviso(false);
    setSegundosRestantes(DURACION_CUENTA_REGRESIVA_S);

    timerAvisoRef.current = setTimeout(() => {
      mostrarAvisoRef.current = true;
      setMostrarAviso(true);

      let restantes = DURACION_CUENTA_REGRESIVA_S;
      setSegundosRestantes(restantes);
      intervaloRef.current = setInterval(() => {
        restantes -= 1;
        setSegundosRestantes(Math.max(restantes, 0));
        if (restantes <= 0) {
          clearInterval(intervaloRef.current);
        }
      }, 1000);
    }, TIEMPO_AVISO_MS);

    // Cierre automático absoluto a los 15 minutos, independiente del aviso.
    timerCierreRef.current = setTimeout(() => {
      cerrarSesion();
    }, TIEMPO_CIERRE_MS);
  }, [cerrarSesion]);

  useEffect(() => {
    const eventosActividad = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Mientras el aviso está visible, la actividad pasiva (mover el mouse,
    // etc.) ya no reinicia el temporizador: la sesión solo se extiende con
    // el botón "Extender sesión" del propio aviso (CP-106).
    const manejarActividad = () => {
      if (!mostrarAvisoRef.current) {
        iniciarTemporizadores();
      }
    };

    eventosActividad.forEach((evento) => window.addEventListener(evento, manejarActividad));
    iniciarTemporizadores();

    return () => {
      eventosActividad.forEach((evento) => window.removeEventListener(evento, manejarActividad));
      limpiarTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extenderSesion = () => {
    iniciarTemporizadores();
  };

  if (!mostrarAviso) return null;

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const segundosTexto = segundos < 10 ? `0${segundos}` : `${segundos}`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div className="modal d-block">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Tu sesión está por expirar</h5>
            </div>
            <div className="modal-body">
              <p>Por inactividad, tu sesión se cerrará automáticamente en:</p>
              <h3 className="text-center">{minutos}:{segundosTexto}</h3>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión ahora</button>
              <button type="button" className="btn btn-primary" onClick={extenderSesion}>Extender sesión</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InactividadTimer;
