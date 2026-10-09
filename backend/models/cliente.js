const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  nombre: { type: String, required: true, trim: true },
  telefono: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true }
}, { timestamps: true, collection: 'Clientes' });

clienteSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

module.exports = mongoose.model('Cliente', clienteSchema);