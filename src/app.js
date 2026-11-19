const express = require('express');
const repo = require('./repository');

const app = express();
app.use(express.json());

function validarDatosLibro(body) {
  if (!body || typeof body !== 'object') return false;
  const { titulo, autor, anio_publicacion } = body;

  const tituloValido = typeof titulo === 'string' && titulo.trim().length > 0;
  const autorValido = typeof autor === 'string' && autor.trim().length > 0;
  const anioValido =
    typeof anio_publicacion === 'number' && Number.isInteger(anio_publicacion);

  return tituloValido && autorValido && anioValido;
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'catalogo-libros-api',
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/libros', async (req, res) => {
  try {
    const libros = await repo.findAll();
    res.status(200).json(libros);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar los libros' });
  }
});

app.get('/libros/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const libro = await repo.findById(id);
    if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });
    res.status(200).json(libro);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el libro' });
  }
});

app.post('/libros', async (req, res) => {
  if (!validarDatosLibro(req.body)) {
    return res.status(400).json({
      error: 'Datos inválidos: titulo y autor son obligatorios, anio_publicacion debe ser entero'
    });
  }
  try {
    const nuevoLibro = await repo.create(req.body);
    res.status(201).json(nuevoLibro);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el libro' });
  }
});

app.put('/libros/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  if (!validarDatosLibro(req.body)) {
    return res.status(400).json({
      error: 'Datos inválidos: titulo y autor son obligatorios, anio_publicacion debe ser entero'
    });
  }
  try {
    const actualizado = await repo.update(id, req.body);
    if (!actualizado) return res.status(404).json({ error: 'Libro no encontrado' });
    res.status(200).json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el libro' });
  }
});

app.delete('/libros/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const eliminado = await repo.remove(id);
    if (!eliminado) return res.status(404).json({ error: 'Libro no encontrado' });
    res.status(200).json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el libro' });
  }
});

module.exports = app;
