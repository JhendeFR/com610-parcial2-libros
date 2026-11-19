# Segundo Examen Parcial — API REST Catálogo de Libros con CI/CD en AWS

**Universidad:** Universidad San Francisco Xavier de Chuquisaca  
**Asignatura:** Trabajando en la Nube (COM610)  
**Semestre:** 2/2026  
**Docente:** Ing. Marcelo Quispe Ortega  
**Estudiante:** Jherson Efrain Vargas Paredes  

---

## 1. Enlaces del Despliegue y Automatización (CI/CD)

* **URL Pública de la API (Nginx Puerto 80):** `http://18.117.194.33`
  * Healthcheck: `http://18.117.194.33/health`
  * Catálogo de libros: `http://18.117.194.33/libros`
* **Repositorio en GitHub:** https://github.com/JhendeFR/com610-parcial2-libros
* **Imagen en Docker Hub:** `jheandefr/libros-api` (`https://hub.docker.com/r/jheandefr/libros-api`)
* **Ejecución exitosa de CI (Pruebas Automatizadas):** https://github.com/JhendeFR/com610-parcial2-libros/actions/runs/44626199046
* **Ejecución exitosa de CD (Build, Push y Despliegue en EC2):** https://github.com/JhendeFR/com610-parcial2-libros/actions/runs/44626198976

---

## 2. Arquitectura e Infraestructura en AWS

Toda la infraestructura fue aprovisionada en la región **Estados Unidos Este - Ohio (`us-east-2`)** dentro de la misma VPC (`vpc-05b0d1a7310480eee`):

| Recurso AWS | Identificador / Nombre | Especificaciones y Seguridad |
|---|---|---|
| **Amazon EC2** | `ec2-libros-jherson-vargas` (`i-0beeaf0474a12b410`) | Ubuntu Server 24.04 LTS, tipo `t3.micro`, IP pública `18.117.194.33`. Ejecuta Nginx como proxy inverso (puerto `80`) hacia el contenedor Docker en `127.0.0.1:3000`. |
| **Security Group EC2** | `ec2-sg-jherson-vargas` (`sg-04764ee4c05ab6de1`) | Entrada: `SSH (22)` habilitado para administración y despliegue vía GitHub Actions; `HTTP (80)` abierto a Internet (`0.0.0.0/0`). Puerto `3000` cerrado al exterior. |
| **Amazon RDS (MySQL)** | `rds-libros-jherson-vargas` | Motor MySQL, instancia `db.t4g.micro`, **Acceso público deshabilitado (`No`)**, base de datos `catalogo_libros`. |
| **Security Group RDS** | `rds-sg-jherson-vargas` (`sg-092a8ac375c63e595`) | Entrada: `MySQL/Aurora (3306)` aceptando tráfico **únicamente** desde el grupo de seguridad `ec2-sg-jherson-vargas` (`sg-04764ee4c05ab6de1`). |

---

## 3. Estructura del Proyecto

```text
com610-parcial2-libros/
├── .github/workflows/
│   ├── ci.yml              # Pipeline CI: npm ci + npm test en push y pull_request
│   └── cd.yml              # Pipeline CD: test -> build/push Docker (SHA) -> deploy EC2 + rollback
├── evidencias/             # Capturas de infraestructura, CRUD, persistencia, Docker y Actions
├── src/
│   ├── app.js              # Definición de rutas Express, validaciones y códigos HTTP
│   ├── db.js               # Pool de conexión MySQL mediante variables de entorno
│   ├── repository.js       # Consultas SQL parametrizadas (CRUD sobre tabla libros)
│   └── server.js           # Punto de entrada HTTP en el puerto 3000
├── tests/
│   └── libros.test.js      # Pruebas con Jest y Supertest (con mock de capa de datos)
├── .dockerignore
├── .env.example            # Plantilla de variables de entorno sin credenciales reales
├── .gitignore
├── db.sql                  # Script DDL para crear la base de datos y tabla libros
├── Dockerfile              # Imagen basada en node:20-alpine
├── package.json
├── package-lock.json
└── README.md
```

---

## 4. Ejecución Local y Pruebas Automatizadas

### 4.1. Ejecución de la API en local

Clonar el repositorio e instalar dependencias:

```bash
git clone https://github.com/JhendeFR/com610-parcial2-libros.git
cd com610-parcial2-libros
npm install
```

Crear el archivo `.env` a partir de `.env.example` con los datos de conexión MySQL y ejecutar `db.sql`:

```bash
cp .env.example .env
mysql -h <DB_HOST> -u <DB_USER> -p < db.sql
```

Iniciar el servidor:

```bash
npm start
```

### 4.2. Ejecución de pruebas (sin RDS real)

Las pruebas utilizan Jest y Supertest aislando `src/repository.js` mediante `jest.mock()`, por lo que no requieren una base de datos activa:

```bash
npm test
```

### 4.3. Construcción y prueba local con Docker

```bash
docker build -t libros-api:local .
docker run -d --name test-libros -p 3000:3000 -e PORT=3000 libros-api:local
curl -i http://localhost:3000/health
docker rm -f test-libros
```

---

## 5. Verificación del Despliegue en Producción

### 5.1. Endpoints disponibles

| Método y Ruta | Descripción | Códigos HTTP |
|---|---|---|
| `GET /health` | Verifica el estado activo del servicio y su versión actual | `200` |
| `GET /libros` | Lista todos los libros almacenados en Amazon RDS | `200` |
| `GET /libros/:id` | Obtiene un libro por su ID | `200`, `400`, `404` |
| `POST /libros` | Registra un nuevo libro (`titulo`, `autor`, `anio_publicacion` entero) | `201`, `400` |
| `PUT /libros/:id` | Actualiza un libro existente | `200`, `400`, `404` |
| `DELETE /libros/:id` | Elimina un libro existente | `200`, `400`, `404` |

### 5.2. Comandos `curl` de verificación externa

```bash
# 1. Verificar estado del servicio y versión desplegada
curl -i http://18.117.194.33/health

# 2. Crear un libro
curl -i -X POST http://18.117.194.33/libros \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Clean Code","autor":"Robert C. Martin","anio_publicacion":2008}'

# 3. Consultar catálogo
curl -i http://18.117.194.33/libros

# 4. Actualizar libro
curl -i -X PUT http://18.117.194.33/libros/1 \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Clean Code (Edicion Revisada)","autor":"Robert C. Martin","anio_publicacion":2009}'

# 5. Eliminar libro
curl -i -X DELETE http://18.117.194.33/libros/1
```

---

## 6. Flujo CI/CD y Estrategia de Rollback

* **Integración Continua (`.github/workflows/ci.yml`):** Se dispara en cada `push` y `pull_request` hacia `main`. Ejecuta `npm ci` y `npm test`; si alguna prueba falla, el workflow falla e impide validar el cambio.
* **Despliegue Continuo (`.github/workflows/cd.yml`):** Se dispara únicamente en `push` sobre `main` (ignora `pull_request`) y ejecuta tres trabajos secuenciales:
  1. `test`: Ejecuta la suite de Jest y Supertest.
  2. `build-and-push`: Construye la imagen Docker y la publica en Docker Hub etiquetada con el SHA del commit (`${{ github.sha }}`) y `latest`.
  3. `deploy`: Se conecta por SSH a EC2 usando GitHub Secrets, respalda el contenedor activo (`libros-api-backup`), inicia el nuevo contenedor enlazado únicamente a `127.0.0.1:3000` leyendo `/opt/libros-api/.env` y verifica `http://127.0.0.1/health` y `http://127.0.0.1/libros`. Ante cualquier fallo en la verificación, detiene el contenedor defectuoso y restaura automáticamente la versión anterior.
