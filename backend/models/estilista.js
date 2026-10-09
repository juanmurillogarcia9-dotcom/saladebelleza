const mongoose = require('mongoose');

const estilistaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  nombre: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  especialidad: { type: String, required: true, trim: true },
  diasTrabajo: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
  horaInicioTrabajo: { type: String, default: '09:00' },
  horaFinTrabajo: { type: String, default: '18:00' },
  edad: { type: Number },
  foto: { type: String }
}, { timestamps: true, collection: 'Estilistas' });

estilistaSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

module.exports = mongoose.model('Estilista', estilistaSchema);