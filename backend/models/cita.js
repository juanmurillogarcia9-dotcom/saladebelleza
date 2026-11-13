const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  estilistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Estilista' },
  servicioId: { type: String, required: true },
  servicio: { type: String, required: true },
  duracionMinutos: { type: Number, required: true },
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Cita', citaSchema);