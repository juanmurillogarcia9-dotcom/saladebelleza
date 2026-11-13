const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

// Importar Modelos (Asegúrate de que 'cita.js' exista en la carpeta models)
const Estilista = require('./models/estilista');
const Usuario = require('./models/usuario');
const Cita = require('./models/cita');

// Inicializar los 3 estilistas por defecto si la base de datos está vacía
async function inicializarDatosBase() {
  try {
    const totalEstilistas = await Estilista.countDocuments();
    if (totalEstilistas === 0) {
      await Estilista.create([
        { 
          nombre: 'Sofía Martínez', 
          especialidad: 'Corte y Coloración Avanzada', 
          edad: 28, 
          foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' 
        },
        { 
          nombre: 'Carlos Gómez', 
          especialidad: 'Barbería Moderna y Estilismo Masculino', 
          edad: 32, 
          foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' 
        },
        { 
          nombre: 'Valentina Ríos', 
          especialidad: 'Tratamientos Spa, Manicure y Cuidado Capilar', 
          edad: 26, 
          foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' 
        }
      ]);
      console.log('¡Los 3 estilistas de prueba fueron creados con éxito en MongoDB Atlas! ✨');
    }
  } catch (error) {
    console.error('Error al inicializar los datos base:', error);
  }
}

// Ruta para obtener estilistas
app.get('/api/estilistas', async (req, res) => {
  try {
    const estilistas = await Estilista.find();
    res.json(estilistas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los estilistas' });
  }
});

// Ruta para obtener servicios (por si el frontend los solicita)
app.get('/api/servicios', async (req, res) => {
  try {
    const serviciosDefault = [
      { id: '1', nombre: 'Corte y Estilizado de Cabello', precio: '45.000', duracionMinutos: 45 },
      { id: '2', nombre: 'Tintura y Balayage', precio: '120.000', duracionMinutos: 120 },
      { id: '3', nombre: 'Manicure y Pedicure Spa', precio: '50.000', duracionMinutos: 60 },
      { id: '4', nombre: 'Maquillaje Profesional', precio: '80.000', duracionMinutos: 50 },
      { id: '5', nombre: 'Tratamiento Capilar Keratina', precio: '150.000', duracionMinutos: 90 }
    ];
    res.json(serviciosDefault);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los servicios' });
  }
});

// NUEVA RUTA: Crear y guardar una cita en la colección 'citas' de MongoDB
app.post('/api/citas', async (req, res) => {
  try {
    const { servicio, estilista, fecha, horaInicio, horaFin } = req.body;

    const nuevaCita = new Cita({
      servicio,
      estilista,
      fecha,
      horaInicio,
      horaFin
    });

    const citaGuardada = await nuevaCita.save();

    res.status(201).json({
      mensaje: '¡Cita agendada con éxito!',
      cita: citaGuardada
    });
  } catch (error) {
    console.error('Error al guardar la cita en BD:', error);
    res.status(500).json({ error: 'Error al registrar la cita en la base de datos.' });
  }
});

// Ruta de Registro flexible
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, correo, email, contraseña, password, telefono, rol, especialidad } = req.body;

    const correoFinal = correo || email;
    const passwordFinal = contraseña || password;

    const nuevoUsuario = new Usuario({ 
      nombre, 
      correo: correoFinal, 
      email: correoFinal,
      contraseña: passwordFinal, 
      password: passwordFinal,
      telefono, 
      rol: rol || 'cliente',
      especialidad 
    });
    
    await nuevoUsuario.save();

    res.status(201).json({ 
      mensaje: '¡Cuenta creada con éxito!', 
      usuario: nuevoUsuario,
      token: 'fake-jwt-token-123' 
    });
  } catch (error) {
    console.error('Error detallado al registrar en BD:', error);
    res.status(500).json({ error: 'Error al registrar el usuario en la base de datos.' });
  }
});

// Ruta de Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const emailUsado = req.body.correo || req.body.email;
    const passUsada = req.body.contraseña || req.body.password;
    
    const usuario = await Usuario.findOne({ 
      $or: [{ correo: emailUsado }, { email: emailUsado }],$or: [{ contraseña: passUsada }, { password: passUsada }] 
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });
    }
    res.json({ mensaje: 'Login exitoso', usuario, token: 'fake-jwt-token-123' });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
  }
});

// Conexión a MongoDB Atlas y arranque del servidor
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Conectado exitosamente a MongoDB Atlas.');
    await inicializarDatosBase();
    app.listen(PORT, () => {
      console.log(`Backend corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error de conexión a MongoDB:', err.message);
  });