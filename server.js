//Dependencias
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

//Conexion a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '21550325',
  database: 'formulario_db'
});

db.connect(err => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a MySQL correctamente');
  }
});

//Ruta para guardar una queja/sugerencia/felicitación
app.post('/api/enviar', (req, res) => {
  const { tipo, titulo, mensaje, correo } = req.body;

  //Validacion del correo
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!correoRegex.test(correo)) {
    return res.status(400).json({ error: 'Correo inválido' });
  }

  //Escapar contenido para evitar inyeccion HTML
  const clean = str =>
    str.replace(/[<>&"']/g, c => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const safeTitulo = clean(titulo);
  const safeMensaje = clean(mensaje);

  if (!tipo || !safeTitulo || !safeMensaje || !correo) {
    return res.status(400).json({ error: 'Campos incompletos' });
  }

  const sql =
    'INSERT INTO quejas (tipo, titulo, mensaje, correo) VALUES (?, ?, ?, ?)';
  db.query(sql, [tipo, safeTitulo, safeMensaje, correo], err => {
    if (err) {
      console.error('Error al guardar:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json({ message: 'Registro guardado correctamente' });
  });
});

//Ruta para listar registros
app.get('/api/listar', (req, res) => {
  const sql = 'SELECT id, tipo, titulo, mensaje, fecha FROM quejas ORDER BY fecha DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al consultar:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

//Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// --- Autenticación básica del administrador ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = '12345'; // cámbialo a algo más seguro

// Inicio de sesión del administrador
app.post('/api/login', (req, res) => {
  const { usuario, clave } = req.body;
  if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Listar con correo solo para admin
app.get('/api/admin/listar', (req, res) => {
  db.query('SELECT * FROM quejas ORDER BY fecha DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al consultar' });
    res.json(results);
  });
});

// Eliminar registro
app.delete('/api/admin/eliminar/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM quejas WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar' });
    res.json({ message: 'Registro eliminado correctamente' });
  });
});
