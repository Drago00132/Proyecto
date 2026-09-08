import axios from 'axios';

// URL del backend: en desarrollo local usa http://localhost:3100 (valor por
// defecto abajo); en producción se toma de la variable de entorno
// REACT_APP_API_URL, definida en tiempo de build (por ejemplo, en Netlify)
// con la URL real del backend desplegado (Render). Antes esta URL estaba
// escrita a mano en cada archivo de view/, lo que impedía desplegar el
// frontend en un host distinto al del backend.
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3100';
axios.defaults.baseURL = API_BASE_URL;

axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axios;