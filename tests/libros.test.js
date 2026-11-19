const request = require('supertest');
const app = require('../src/app');
const repo = require('../src/repository');

jest.mock('../src/repository');

describe('API REST Catálogo de Libros (sin RDS real)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /health responde 200 y estado activo', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /libros crea un libro válido y devuelve 201', async () => {
    const payload = {
      titulo: 'Designing Data-Intensive Applications',
      autor: 'Martin Kleppmann',
      anio_publicacion: 2017
    };
    repo.create.mockResolvedValue({ id: 1, ...payload });

    const res = await request(app).post('/libros').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 1, ...payload });
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  test('POST /libros rechaza datos inválidos con 400', async () => {
    const res = await request(app).post('/libros').send({
      titulo: '   ',
      autor: 'Autor Prueba',
      anio_publicacion: '2020'
    });
    expect(res.statusCode).toBe(400);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test('GET /libros/:id devuelve 404 cuando el libro no existe', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).get('/libros/999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /libros devuelve lista de libros con 200', async () => {
    repo.findAll.mockResolvedValue([
      { id: 1, titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', anio_publicacion: 1943 }
    ]);

    const res = await request(app).get('/libros');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });
});
