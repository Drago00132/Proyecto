
function manejarError(error, res, contexto = '') {
    console.error(`Error${contexto ? ' en ' + contexto : ''}:`, error);

    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({ message: 'Servicio de base de datos no disponible. Intenta más tarde.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un registro con esos datos.' });
    }
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({ message: 'No se puede eliminar: este registro tiene datos relacionados en el sistema.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: 'Uno de los datos relacionados no existe.' });
    }

    return res.status(500).json({ message: 'Ocurrió un error interno. Intenta de nuevo más tarde.' });
}

module.exports = manejarError;