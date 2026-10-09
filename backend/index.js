const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET no está configurada; las sesiones actuales dejarán de ser válidas al reiniciar el backend.');
}

const Estilista = require('./models/estilista');
const Usuario = require('./models/usuario');
const Cliente = require('./models/cliente');
const Cita = require('./models/cita');

const servicios = [
  { id: '1', nombre: 'Corte y Estilizado de Cabello', precio: '45.000', duracionMinutos: 45 },
  { id: '2', nombre: 'Tintura y Balayage', precio: '120.000', duracionMinutos: 120 },
  { id: '3', nombre: 'Manicure y Pedicure Spa', precio: '50.000', duracionMinutos: 60 },
  { id: '4', nombre: 'Maquillaje Profesional', precio: '80.000', duracionMinutos: 50 },
  { id: '5', nombre: 'Tratamiento Capilar Keratina', precio: '150.000', duracionMinutos: 90 }
];

const DIAS_LABORALES = [1, 2, 3, 4, 5, 6];

function diasTrabajoDe(estilista) {
  return Array.isArray(estilista.diasTrabajo) && estilista.diasTrabajo.length > 0
    ? estilista.diasTrabajo
    : DIAS_LABORALES;
}

function minutosDeHora(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function horaDeMinutos(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

function fechaEsValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));
  return fechaUTC.getUTCFullYear() === anio &&
    fechaUTC.getUTCMonth() === mes - 1 &&
    fechaUTC.getUTCDate() === dia;
}

function hoyEnBogota() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function diaSemana(fecha) {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

function citaActiva(cita) {
  return !['rechazada', 'cancelada'].includes(cita.estado);
}

function citaSeCruza(cita, inicio, fin) {
  return minutosDeHora(cita.horaInicio) < fin && minutosDeHora(cita.horaFin) > inicio;
}

function especialidadCoincide(estilista, servicio) {
  const normalizar = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
  return normalizar(estilista.especialidad) === normalizar(servicio.nombre);
}

async function obtenerDisponibilidad({ fecha, servicio, estilista, cliente }) {
  const desde = minutosDeHora(estilista.horaInicioTrabajo || '09:00');
  const hasta = minutosDeHora(estilista.horaFinTrabajo || '18:00');
  const minutosTurno = Math.max(0, hasta - desde);
  const citas = await Cita.find({
    fecha,
    estado: { $nin: ['rechazada', 'cancelada'] },
    $or: [{ estilistaId: estilista._id }, { clienteId: cliente._id }]
  }).select('clienteId estilistaId horaInicio horaFin duracionMinutos estado');
  const citasEstilista = citas.filter((cita) => cita.estilistaId?.toString() === estilista._id.toString());
  const citasCliente = citas.filter((cita) => cita.clienteId?.toString() === cliente._id.toString());
  const minutosReservados = citasEstilista.reduce(
    (total, cita) => total + (Number(cita.duracionMinutos) || minutosDeHora(cita.horaFin) - minutosDeHora(cita.horaInicio)),
    0
  );
  const porcentajeOcupacion = minutosTurno
    ? Math.min(100, Math.round((minutosReservados / minutosTurno) * 100))
    : 100;
  const fechaHoy = hoyEnBogota();
  const ahora = new Date();
  const horaActual = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(ahora);
  const minutosAhora = minutosDeHora(horaActual);
  const slots = [];

  for (let inicio = desde; inicio + servicio.duracionMinutos <= hasta; inicio += 30) {
    const fin = inicio + servicio.duracionMinutos;
    const conflictoEstilista = citasEstilista.some((cita) => citaSeCruza(cita, inicio, fin));
    const conflictoCliente = citasCliente.some((cita) => citaSeCruza(cita, inicio, fin));
    const horaPasada = fecha < fechaHoy || (fecha === fechaHoy && inicio <= minutosAhora);
    const motivos = [];
    if (conflictoEstilista) motivos.push('El estilista ya tiene una cita en ese horario.');
    if (conflictoCliente) motivos.push('El cliente ya tiene otra cita en ese horario.');
    if (horaPasada) motivos.push('Ese horario ya pasó.');
    slots.push({
      horaInicio: horaDeMinutos(inicio),
      horaFin: horaDeMinutos(fin),
      disponible: motivos.length === 0,
      motivos
    });
  }

  return {
    horario: {
      diasTrabajo: diasTrabajoDe(estilista),
      horaInicio: estilista.horaInicioTrabajo || '09:00',
      horaFin: estilista.horaFinTrabajo || '18:00'
    },
    ocupacion: {
      citas: citasEstilista.length,
      minutosReservados,
      minutosDisponibles: Math.max(0, minutosTurno - minutosReservados),
      porcentaje: porcentajeOcupacion,
      nivel: porcentajeOcupacion >= 80 ? 'muy_llena' : porcentajeOcupacion >= 50 ? 'ocupada' : 'disponible'
    },
    slots
  };
}

function autenticar(req, res, next) {
  const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Debes iniciar sesión.' });

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'La sesión no es válida. Inicia sesión nuevamente.' });
  }
}

function responderConError(res, error, mensaje) {
  if (error.code === 11000) {
    return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo.' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: error.message });
  }
  console.error(mensaje, error);
  return res.status(500).json({ error: mensaje });
}

async function registrarCuenta(req, res, rolForzado) {
  const {
    nombre,
    email,
    correo,
    password,
    contraseña,
    telefono,
    especialidad
  } = req.body;
  const rol = rolForzado || req.body.rol || 'cliente';
  const correoNormalizado = String(email || correo || '').trim().toLowerCase();
  const passwordPlano = password || contraseña;

  if (!nombre?.trim() || !correoNormalizado || !passwordPlano) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
  }
  if (passwordPlano.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }
  if (!['cliente', 'estilista'].includes(rol)) {
    return res.status(400).json({ error: 'El tipo de cuenta no es válido.' });
  }
  if (rol === 'cliente' && !telefono?.trim()) {
    return res.status(400).json({ error: 'El teléfono es obligatorio para crear una cuenta de cliente.' });
  }
  if (rol === 'estilista' && !especialidad?.trim()) {
    return res.status(400).json({ error: 'La especialidad es obligatoria para crear una cuenta de estilista.' });
  }
  const existente = await Usuario.findOne({
    $or: [{ email: correoNormalizado }, { correo: correoNormalizado }]
  });
  if (existente) {
    return res.status(409).json({ error: 'Ese correo ya tiene una cuenta registrada. Inicia sesión o usa otro correo.' });
  }

  if (rol === 'cliente') {
    const perfilExistente = await Cliente.findOne({ email: correoNormalizado }).select('_id');
    if (perfilExistente) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese correo. Verifica sus datos antes de volver a registrarlo.' });
    }
  } else {
    const estilistaExistente = await Estilista.findOne({ email: correoNormalizado }).select('_id');
    if (estilistaExistente) {
      return res.status(409).json({ error: 'Ya existe un estilista registrado con ese correo.' });
    }
    const nombreExistente = await Estilista.findOne({ nombre: nombre.trim() })
      .collation({ locale: 'es', strength: 2 })
      .select('_id');
    if (nombreExistente) {
      return res.status(409).json({ error: 'Ya existe un estilista con ese nombre. Si es otra persona, agrega sus apellidos para diferenciarla.' });
    }
  }

  const sesion = await mongoose.startSession();
  let usuarioCreado;
  try {
    await sesion.withTransaction(async () => {
      const [usuario] = await Usuario.create([{
        nombre: nombre.trim(),
        email: correoNormalizado,
        correo: correoNormalizado,
        passwordHash: await bcrypt.hash(passwordPlano, 12),
        telefono: telefono?.trim(),
        rol
      }], { session: sesion });
      usuarioCreado = usuario;

      if (rol === 'cliente') {
        await Cliente.create([{
          userId: usuario._id,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: correoNormalizado
        }], { session: sesion });
      } else {
        await Estilista.create([{
          userId: usuario._id,
          nombre: nombre.trim(),
          email: correoNormalizado,
          especialidad: especialidad.trim(),
          edad: 25,
          foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
        }], { session: sesion });
      }
    });
  } finally {
    await sesion.endSession();
  }

  const token = jwt.sign({ id: usuarioCreado._id.toString(), rol }, JWT_SECRET, { expiresIn: '7d' });
  return res.status(201).json({
    mensaje: 'La cuenta y el perfil se guardaron correctamente.',
    usuario: usuarioCreado,
    token
  });
}

app.get('/api/estilistas', async (req, res) => {
  try {
    const estilistas = await Estilista.find({ userId: { $exists: true, $ne: null } })
      .select('nombre especialidad diasTrabajo horaInicioTrabajo horaFinTrabajo edad foto')
      .sort({ nombre: 1 })
      .limit(1000);
    res.json(estilistas.map((estilista) => ({
      ...estilista.toJSON(),
      diasTrabajo: diasTrabajoDe(estilista)
    })));
  } catch (error) {
    responderConError(res, error, 'Error al obtener los estilistas.');
  }
});

app.get('/api/estilistas/mi-horario', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'estilista') {
      return res.status(403).json({ error: 'Solo los estilistas pueden consultar su horario de trabajo.' });
    }
    const estilista = await Estilista.findOne({ userId: req.usuario.id })
      .select('diasTrabajo horaInicioTrabajo horaFinTrabajo');
    if (!estilista) return res.status(404).json({ error: 'No se encontró el perfil de estilista.' });
    res.json({
      diasTrabajo: diasTrabajoDe(estilista),
      horaInicioTrabajo: estilista.horaInicioTrabajo || '09:00',
      horaFinTrabajo: estilista.horaFinTrabajo || '18:00'
    });
  } catch (error) {
    responderConError(res, error, 'Error al consultar el horario de trabajo.');
  }
});

app.put('/api/estilistas/mi-horario', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'estilista') {
      return res.status(403).json({ error: 'Solo los estilistas pueden cambiar su horario de trabajo.' });
    }
    const { diasTrabajo, horaInicioTrabajo, horaFinTrabajo } = req.body;
    if (
      !Array.isArray(diasTrabajo) ||
      diasTrabajo.length === 0 ||
      diasTrabajo.some((dia) => !DIAS_LABORALES.includes(dia)) ||
      new Set(diasTrabajo).size !== diasTrabajo.length ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaInicioTrabajo || '') ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaFinTrabajo || '') ||
      minutosDeHora(horaFinTrabajo) <= minutosDeHora(horaInicioTrabajo) ||
      minutosDeHora(horaInicioTrabajo) < 9 * 60 ||
      minutosDeHora(horaFinTrabajo) > 18 * 60
    ) {
      return res.status(400).json({ error: 'Elige al menos un día laboral y un horario válido entre 9:00 y 18:00.' });
    }
    const estilista = await Estilista.findOneAndUpdate(
      { userId: req.usuario.id },
      { diasTrabajo: [...diasTrabajo].sort(), horaInicioTrabajo, horaFinTrabajo },
      { new: true, runValidators: true, select: 'diasTrabajo horaInicioTrabajo horaFinTrabajo' }
    );
    if (!estilista) return res.status(404).json({ error: 'No se encontró el perfil de estilista.' });
    res.json({
      mensaje: 'Tu horario de trabajo quedó guardado.',
      horario: {
        diasTrabajo: estilista.diasTrabajo,
        horaInicioTrabajo: estilista.horaInicioTrabajo,
        horaFinTrabajo: estilista.horaFinTrabajo
      }
    });
  } catch (error) {
    responderConError(res, error, 'Error al guardar el horario de trabajo.');
  }
});

app.post('/api/estilistas', async (req, res) => {
  try {
    await registrarCuenta(req, res, 'estilista');
  } catch (error) {
    responderConError(res, error, 'Error al registrar el estilista.');
  }
});

app.get('/api/citas', autenticar, async (req, res) => {
  try {
    const filtro = {};
    if (req.query.fecha) {
      filtro.fecha = req.query.fecha;
    } else if (req.query.desde || req.query.hasta) {
      const { desde, hasta } = req.query;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(desde || '') ||
        !/^\d{4}-\d{2}-\d{2}$/.test(hasta || '') ||
        desde > hasta
      ) {
        return res.status(400).json({ error: 'El rango de fechas no es válido.' });
      }
      filtro.fecha = { $gte: desde, $lte: hasta };
    }

    if (req.usuario.rol === 'cliente') {
      const cliente = await Cliente.findOne({ userId: req.usuario.id }).select('_id');
      if (!cliente) return res.json([]);
      filtro.clienteId = cliente._id;
    } else if (req.usuario.rol === 'estilista') {
      const estilista = await Estilista.findOne({ userId: req.usuario.id }).select('_id');
      if (!estilista) {
        return res.status(404).json({ error: 'No se encontró tu perfil de estilista. Vuelve a iniciar sesión o contacta al salón.' });
      }
      filtro.estilistaId = estilista._id;
    } else {
      return res.status(403).json({ error: 'No tienes permiso para ver las citas.' });
    }

    const citas = await Cita.find(filtro)
      .populate('clienteId', 'nombre telefono email')
      .populate('estilistaId', 'nombre especialidad')
      .sort({ fecha: 1, horaInicio: 1 })
      .limit(500);
    res.json(citas.map((cita) => {
      const datos = cita.toJSON();
      if (!datos.estado) datos.estado = 'confirmada';
      return datos;
    }));
  } catch (error) {
    responderConError(res, error, 'Error al obtener las citas.');
  }
});

app.get('/api/disponibilidad', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') {
      return res.status(403).json({ error: 'La disponibilidad para reservar solo está disponible para clientes.' });
    }
    const { fecha, servicioId, estilistaId } = req.query;
    const servicio = servicios.find((item) => item.id === String(servicioId));
    if (!fechaEsValida(fecha) || fecha < hoyEnBogota()) {
      return res.status(400).json({ error: 'Selecciona una fecha válida desde hoy en adelante.' });
    }
    if (!servicio || !mongoose.isValidObjectId(estilistaId)) {
      return res.status(400).json({ error: 'Selecciona un servicio y un estilista válidos.' });
    }
    const [cliente, estilista] = await Promise.all([
      Cliente.findOne({ userId: req.usuario.id }).select('_id'),
      Estilista.findOne({ _id: estilistaId, userId: { $exists: true, $ne: null } })
        .select('especialidad diasTrabajo horaInicioTrabajo horaFinTrabajo')
    ]);
    if (!cliente) return res.status(404).json({ error: 'No se encontró el perfil del cliente.' });
    if (!estilista) return res.status(404).json({ error: 'El estilista seleccionado no tiene una cuenta activa.' });
    if (!especialidadCoincide(estilista, servicio)) {
      return res.status(409).json({ error: 'La especialidad del estilista no corresponde al servicio seleccionado.' });
    }
    if (!diasTrabajoDe(estilista).includes(diaSemana(fecha))) {
      return res.json({
        fecha,
        horario: {
          diasTrabajo: diasTrabajoDe(estilista),
          horaInicioTrabajo: estilista.horaInicioTrabajo,
          horaFinTrabajo: estilista.horaFinTrabajo
        },
        ocupacion: { citas: 0, minutosReservados: 0, minutosDisponibles: 0, porcentaje: 0, nivel: 'disponible' },
        slots: []
      });
    }
    const disponibilidad = await obtenerDisponibilidad({ fecha, servicio, estilista, cliente });
    res.json({ fecha, ...disponibilidad });
  } catch (error) {
    responderConError(res, error, 'Error al consultar los horarios disponibles.');
  }
});

app.post('/api/citas', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') {
      return res.status(403).json({ error: 'Solo los clientes pueden agendar citas.' });
    }

    const { servicioId, estilistaId, fecha, horaInicio } = req.body;
    const servicio = servicios.find((item) => item.id === String(servicioId));
    if (!servicio || !mongoose.isValidObjectId(estilistaId)) {
      return res.status(400).json({ error: 'Selecciona un servicio y un estilista válidos.' });
    }
    if (!fechaEsValida(fecha) || fecha < hoyEnBogota() || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaInicio || '')) {
      return res.status(400).json({ error: 'La fecha o la hora de la cita no son válidas. Selecciona una fecha desde hoy.' });
    }

    const [cliente, estilista] = await Promise.all([
      Cliente.findOne({ userId: req.usuario.id }).select('_id'),
      Estilista.findOne({ _id: estilistaId, userId: { $exists: true, $ne: null } })
        .select('especialidad diasTrabajo horaInicioTrabajo horaFinTrabajo')
    ]);
    if (!cliente) return res.status(404).json({ error: 'No se encontró el perfil del cliente.' });
    if (!estilista) return res.status(404).json({ error: 'No se encontró el estilista seleccionado.' });
    if (!especialidadCoincide(estilista, servicio)) {
      return res.status(409).json({ error: 'La especialidad del estilista no corresponde al servicio seleccionado.' });
    }
    if (!diasTrabajoDe(estilista).includes(diaSemana(fecha))) {
      return res.status(409).json({ error: 'El estilista no trabaja el día seleccionado.' });
    }
    const minutosInicio = minutosDeHora(horaInicio);
    const minutosFin = minutosInicio + servicio.duracionMinutos;
    const inicioTurno = minutosDeHora(estilista.horaInicioTrabajo);
    const finTurno = minutosDeHora(estilista.horaFinTrabajo);
    if (
      minutosInicio < inicioTurno ||
      minutosFin > finTurno ||
      (minutosInicio - inicioTurno) % 30 !== 0
    ) {
      return res.status(409).json({ error: 'La cita no cabe en el turno de trabajo del estilista. Elige un horario disponible.' });
    }
    const disponibilidad = await obtenerDisponibilidad({ fecha, servicio, estilista, cliente });
    const slot = disponibilidad.slots.find((opcion) => opcion.horaInicio === horaInicio);
    if (!slot?.disponible) {
      const motivo = slot?.motivos.join(' ') || 'Ese horario no está disponible para la duración del servicio.';
      return res.status(409).json({ error: motivo, ocupacion: disponibilidad.ocupacion });
    }

    const cita = await Cita.create({
      clienteId: cliente._id,
      estilistaId: estilista._id,
      servicioId: servicio.id,
      servicio: servicio.nombre,
      duracionMinutos: servicio.duracionMinutos,
      fecha,
      horaInicio,
      horaFin: slot.horaFin,
      estado: 'pendiente'
    });
    await cita.populate([
      { path: 'clienteId', select: 'nombre telefono email' },
      { path: 'estilistaId', select: 'nombre especialidad' }
    ]);
    res.status(201).json({
      mensaje: 'La solicitud de cita se guardó. Está pendiente de aceptación por el estilista.',
      cita
    });
  } catch (error) {
    responderConError(res, error, 'Error al registrar la cita.');
  }
});

app.patch('/api/citas/:id/estado', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'estilista') {
      return res.status(403).json({ error: 'Solo un estilista puede responder a una solicitud de cita.' });
    }
    const { estado } = req.body;
    if (!['confirmada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ error: 'La respuesta debe ser aceptar o rechazar la cita.' });
    }
    const estilista = await Estilista.findOne({ userId: req.usuario.id })
      .select('_id diasTrabajo horaInicioTrabajo horaFinTrabajo');
    if (!estilista) return res.status(404).json({ error: 'No se encontró el perfil de estilista.' });
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ error: 'No se encontró la cita solicitada.' });
    if (cita.estilistaId?.toString() !== estilista._id.toString()) {
      return res.status(403).json({ error: 'Esta solicitud fue enviada a otro estilista.' });
    }
    if (cita.estado && cita.estado !== 'pendiente') {
      return res.status(409).json({ error: 'Esta cita ya recibió una respuesta.' });
    }

    if (estado === 'confirmada') {
      const dia = diaSemana(cita.fecha);
      const inicio = minutosDeHora(cita.horaInicio);
      const fin = minutosDeHora(cita.horaFin);
      const inicioTurno = minutosDeHora(estilista.horaInicioTrabajo || '09:00');
      const finTurno = minutosDeHora(estilista.horaFinTrabajo || '18:00');
      if (
        !diasTrabajoDe(estilista).includes(dia) ||
        inicio < inicioTurno ||
        fin > finTurno
      ) {
        return res.status(409).json({ error: 'La cita ya no coincide con tu horario laboral. Actualiza tu horario o rechaza la solicitud.' });
      }
      const conflictoEstilista = await Cita.findOne({
        _id: { $ne: cita._id },
        estilistaId: estilista._id,
        fecha: cita.fecha,
        estado: { $nin: ['rechazada', 'cancelada'] },
        horaInicio: { $lt: cita.horaFin },
        horaFin: { $gt: cita.horaInicio }
      }).select('_id');
      if (conflictoEstilista) {
        return res.status(409).json({ error: 'Ya tienes otra cita ocupando ese horario.' });
      }
      const conflictoCliente = await Cita.findOne({
        _id: { $ne: cita._id },
        clienteId: cita.clienteId,
        fecha: cita.fecha,
        estado: { $nin: ['rechazada', 'cancelada'] },
        horaInicio: { $lt: cita.horaFin },
        horaFin: { $gt: cita.horaInicio }
      }).select('_id');
      if (conflictoCliente) {
        return res.status(409).json({ error: 'El cliente tiene otra cita que se cruza con este horario.' });
      }
    }

    cita.estado = estado;
    await cita.save();
    await cita.populate([
      { path: 'clienteId', select: 'nombre telefono email' },
      { path: 'estilistaId', select: 'nombre especialidad' }
    ]);
    res.json({
      mensaje: estado === 'confirmada' ? 'Cita aceptada y confirmada.' : 'Solicitud de cita rechazada.',
      cita
    });
  } catch (error) {
    responderConError(res, error, 'Error al responder a la cita.');
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    await registrarCuenta(req, res);
  } catch (error) {
    responderConError(res, error, 'Error al registrar la cuenta.');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const rolSolicitado = req.body.rol;
    if (!['cliente', 'estilista'].includes(rolSolicitado)) {
      return res.status(400).json({ error: 'Selecciona si vas a iniciar sesión como cliente o estilista.' });
    }
    const correoNormalizado = String(req.body.email || req.body.correo || '').trim().toLowerCase();
    const passwordPlano = req.body.password || req.body.contraseña;
    if (!correoNormalizado || !passwordPlano) {
      return res.status(400).json({ error: 'El correo y la contraseña son obligatorios.' });
    }

    const usuario = await Usuario.findOne({
      $or: [{ email: correoNormalizado }, { correo: correoNormalizado }]
    }).select('+passwordHash +password +contraseña');
    let contraseñaValida = false;

    if (usuario?.passwordHash) {
      contraseñaValida = await bcrypt.compare(passwordPlano, usuario.passwordHash);
    } else if (usuario) {
      contraseñaValida = passwordPlano === usuario.password || passwordPlano === usuario.contraseña;
      if (contraseñaValida) {
        usuario.passwordHash = await bcrypt.hash(passwordPlano, 12);
        await usuario.save();
        await Usuario.updateOne(
          { _id: usuario._id },
          { $unset: { password: 1, contraseña: 1 } }
        );
      }
    }

    if (!usuario || !contraseñaValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    if (usuario.rol !== rolSolicitado) {
      return res.status(403).json({
        error: `Esta cuenta está registrada como ${usuario.rol}. No puedes iniciar sesión como ${rolSolicitado}.`
      });
    }
    const token = jwt.sign({ id: usuario._id.toString(), rol: usuario.rol }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ mensaje: 'Inicio de sesión exitoso.', usuario, token });
  } catch (error) {
    responderConError(res, error, 'Error al iniciar sesión.');
  }
});

app.get('/api/clientes', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'estilista') {
      return res.status(403).json({ error: 'No tienes permiso para ver el directorio de clientes.' });
    }
    const clientes = await Cliente.find().select('nombre telefono email').sort({ nombre: 1 });
    res.json(clientes);
  } catch (error) {
    responderConError(res, error, 'Error al obtener los clientes.');
  }
});

app.post('/api/clientes', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'estilista') {
      return res.status(403).json({ error: 'No tienes permiso para registrar clientes.' });
    }
    const { nombre, telefono, email } = req.body;
    const nombreLimpio = nombre?.trim();
    const telefonoLimpio = telefono?.trim();
    const correoNormalizado = String(email || '').trim().toLowerCase();
    if (!nombreLimpio || !telefonoLimpio || !correoNormalizado) {
      return res.status(400).json({ error: 'Nombre, teléfono y correo son obligatorios.' });
    }
    if (await Cliente.findOne({ email: correoNormalizado }).select('_id')) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese correo electrónico.' });
    }
    const clienteExistente = await Cliente.findOne({
      nombre: nombreLimpio,
      telefono: telefonoLimpio
    }).collation({ locale: 'es', strength: 2 }).select('_id');
    if (clienteExistente) {
      return res.status(409).json({ error: 'Ese cliente ya fue registrado con el mismo nombre y teléfono.' });
    }
    const cliente = await Cliente.create({
      nombre: nombreLimpio,
      telefono: telefonoLimpio,
      email: correoNormalizado
    });
    res.status(201).json({ mensaje: 'El cliente se guardó correctamente.', cliente });
  } catch (error) {
    responderConError(res, error, 'Error al registrar el cliente.');
  }
});

app.get('/api/servicios', (req, res) => {
  res.json(servicios);
});

async function inicializarDatosBase() {
  const totalEstilistas = await Estilista.countDocuments();
  if (totalEstilistas !== 0) return;
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
  console.log('Estilistas iniciales creados en MongoDB Atlas.');
}

if (!MONGO_URI) {
  console.error('Falta configurar MONGO_URI en backend/.env.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Conectado exitosamente a MongoDB Atlas.');
    await inicializarDatosBase();
    app.listen(PORT, () => {
      console.log(`Backend corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error de conexión a MongoDB:', error.message);
    process.exit(1);
  });
