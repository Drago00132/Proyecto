import axios from 'axios';
import { toast } from 'react-toastify';

function eliminarRecurso({ url, mensajeExito, mensajeError, cerrarmodal }) {
  return axios.delete(url).then(() => {
    toast.success(mensajeExito);
    cerrarmodal();
  }).catch((error) => {
    console.error("Error al eliminar: ", error);
    toast.error(mensajeError);
    cerrarmodal();
  });
}

export default eliminarRecurso;
