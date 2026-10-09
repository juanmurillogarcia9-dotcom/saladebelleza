const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  correo: { type: String, lowercase: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  contraseña: { type: String, select: false },
  password: { type: String, select: false },
  telefono: { type: String, trim: true },
  rol: { type: String, enum: ['cliente', 'estilista'], default: 'cliente', required: true },
  especialidad: { type: String, trim: true }
}, {
  timestamps: true,
  collection: 'Usuarios',
  toJSON: {
    transform(_doc, ret) {
      delete ret.passwordHash;
      delete ret.contraseña;
      delete ret.password;
      return ret;
    }
  }
});

usuarioSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

module.exports = mongoose.model('Usuario', usuarioSchema);