const pool = require('./db');

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, titulo, autor, anio_publicacion FROM libros ORDER BY id ASC'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, titulo, autor, anio_publicacion FROM libros WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function create({ titulo, autor, anio_publicacion }) {
  const [result] = await pool.query(
    'INSERT INTO libros (titulo, autor, anio_publicacion) VALUES (?, ?, ?)',
    [titulo.trim(), autor.trim(), anio_publicacion]
  );
  return {
    id: result.insertId,
    titulo: titulo.trim(),
    autor: autor.trim(),
    anio_publicacion
  };
}

async function update(id, { titulo, autor, anio_publicacion }) {
  const [result] = await pool.query(
    'UPDATE libros SET titulo = ?, autor = ?, anio_publicacion = ? WHERE id = ?',
    [titulo.trim(), autor.trim(), anio_publicacion, id]
  );
  if (result.affectedRows === 0) return null;
  return {
    id: Number(id),
    titulo: titulo.trim(),
    autor: autor.trim(),
    anio_publicacion
  };
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM libros WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
