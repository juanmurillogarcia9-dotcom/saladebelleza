const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true }, // Sin unique: true para evitar bloqueos
  email: { type: String }, // Opcional por compatibilidad
  contraseña: { type: String, required: true },
  password: { type: String }, // Opcional por compatibilidad
  telefono: { type: String },
  rol: { type: String, default: 'cliente' },
  especialidad: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);