const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  estilistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Estilista' },
  servicioId: { type: String, required: true },
  servicio: { type: String, required: true },
  duracionMinutos: { type: Number, required: true },
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'confirmada', 'rechazada'], default: 'pendiente', index: true }
}, { timestamps: true, collection: 'Citas' });

citaSchema.index({ fecha: 1, horaInicio: 1 });
citaSchema.index({ estilistaId: 1, fecha: 1, horaInicio: 1, horaFin: 1 });

module.exports = mongoose.model('Cita', citaSchema);