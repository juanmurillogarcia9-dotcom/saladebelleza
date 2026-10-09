<template>
  <q-page class="esther-page q-pa-xl flex flex-center">
    <div class="salon-background"></div>

    <div class="agenda-wrapper">
      <div class="q-mb-xl text-center header-container">
        <span class="sub-title-badge">✨ Panel Exclusivo ✨</span>
        <h1 class="luxury-heading text-h3 text-weight-bold text-dark q-mt-sm q-mb-xs">
          Agenda de {{ auth.usuario?.nombre || 'Administrador' }}
        </h1>
        <p class="text-subtitle1 text-muted luxury-subtitle">
          Configura tus turnos, revisa los espacios disponibles y responde a las solicitudes de tus clientes.
        </p>
      </div>

      <div class="agenda-container q-mx-auto">
        <section class="esther-card q-mb-lg work-hours-card">
          <div class="flex items-center justify-between q-mb-md">
            <div>
              <div class="text-h6 luxury-heading text-pink text-weight-bold">Mi horario de trabajo</div>
              <p class="week-caption">Las reservas solo estarán disponibles dentro de este turno.</p>
            </div>
            <button class="save-hours-button" type="button" :disabled="guardandoHorario || !horarioCargado" @click="guardarHorario">
              {{ guardandoHorario ? 'Guardando...' : 'Guardar horario' }}
            </button>
          </div>
          <div class="work-hours-controls">
            <div class="work-days">
              <label v-for="dia in diasLaborales" :key="dia.id" class="work-day-option">
                <input v-model="horario.diasTrabajo" type="checkbox" :value="dia.id" />
                <span>{{ dia.nombre }}</span>
              </label>
            </div>
            <div class="work-time-controls">
              <label>Desde <input v-model="horario.horaInicioTrabajo" type="time" min="09:00" max="17:30" /></label>
              <label>Hasta <input v-model="horario.horaFinTrabajo" type="time" min="09:30" max="18:00" /></label>
            </div>
          </div>
          <p v-if="errorHorario" class="load-error" role="alert">{{ errorHorario }}</p>
          <p v-if="mensajeHorario" class="form-success" role="status">{{ mensajeHorario }}</p>
        </section>

        <section class="esther-card q-mb-lg calendar-card">
          <div class="calendar-toolbar">
            <div>
              <div class="text-pink text-weight-bold luxury-label">📅 Agenda semanal</div>
              <p class="week-caption">{{ rangoSemana }}</p>
            </div>
            <div class="calendar-actions">
              <button
                type="button"
                class="week-button"
                :disabled="!puedeSemanaAnterior"
                aria-label="Ver semana anterior"
                @click="cambiarSemana(-1)"
              >‹</button>
              <input
                v-model="fechaSeleccionada"
                :min="fechaMinima"
                type="date"
                class="date-input-luxury"
                aria-label="Elegir fecha de agenda"
              />
              <button type="button" class="week-button" aria-label="Ver semana siguiente" @click="cambiarSemana(1)">›</button>
            </div>
          </div>

          <div class="week-days">
            <button
              v-for="dia in diasSemana"
              :key="dia.fecha"
              type="button"
              class="day-button"
              :class="{ selected: fechaSeleccionada === dia.fecha, closed: dia.cerrado }"
              :aria-pressed="fechaSeleccionada === dia.fecha"
              @click="fechaSeleccionada = dia.fecha"
            >
              <span class="day-name">{{ dia.nombre }}</span>
              <strong class="day-number">{{ dia.numero }}</strong>
              <span class="day-availability">
                {{ errorCarga ? 'Agenda sin conexión' : dia.cerrado ? 'Día de descanso' : 'Trabajas' }}
              </span>
              <span v-if="!dia.cerrado && !errorCarga" class="day-appointments">
                {{ dia.citas }} {{ dia.citas === 1 ? 'cita' : 'citas' }} · {{ dia.disponibles }} libres
              </span>
            </button>
          </div>
        </section>

        <section class="esther-card schedule-card">
          <div class="flex items-center justify-between q-mb-lg">
            <div>
              <div class="text-h6 luxury-heading text-pink text-weight-bold">Mi turno de trabajo</div>
              <p class="selected-date">{{ fechaSeleccionadaLarga }}</p>
            </div>
            <span class="badge-count">
              {{ errorCarga ? 'Agenda no disponible' : esDiaCerrado ? 'Día de descanso' : `${citasDia.length} ${citasDia.length === 1 ? 'cita' : 'citas'} · ${bloquesLibres.length} libres` }}
            </span>
          </div>
          <p v-if="errorCarga" class="load-error" role="alert">{{ errorCarga }}</p>
          <p v-else-if="ocupacionDia.porcentaje >= 80" class="busy-warning" role="status">
            Agenda muy llena: {{ ocupacionDia.porcentaje }}% del turno está ocupado.
          </p>
          <p v-else-if="ocupacionDia.porcentaje >= 50" class="busy-notice" role="status">
            Agenda ocupada: {{ ocupacionDia.porcentaje }}% del turno ya tiene citas.
          </p>

          <div v-if="esDiaCerrado" class="closed-state">
            No tienes turno de trabajo este día.
          </div>
          <div v-else-if="!errorCarga" class="availability-grid" aria-label="Horarios disponibles y ocupados">
            <div
              v-for="bloque in bloquesDia"
              :key="bloque.inicio"
              class="availability-slot"
              :class="bloque.estado"
            >
              <strong>{{ bloque.inicio }}</strong>
              <span>{{ bloque.fin }}</span>
              <small>
                {{ bloque.estado === 'disponible' ? 'Disponible' : bloque.estado === 'ocupado' ? 'Ocupado' : 'Hora pasada' }}
              </small>
            </div>
          </div>

          <div class="legend">
            <span><i class="legend-dot free"></i> Disponible para solicitudes</span>
            <span><i class="legend-dot busy"></i> Ocupado por una cita</span>
          </div>
        </section>

        <section class="esther-card appointments-card">
          <div class="flex items-center justify-between q-mb-lg">
            <div class="text-h6 luxury-heading text-pink text-weight-bold">Qué tienes que hacer y con quién</div>
            <span class="badge-count">{{ citasDia.length }} {{ citasDia.length === 1 ? 'cita' : 'citas' }}</span>
          </div>

          <div v-if="citasDia.length" class="appointment-list">
            <article v-for="cita in citasDia" :key="cita._id || cita.id" class="appointment-row">
              <div class="appointment-time">
                <span class="text-pink text-weight-bold time-badge">{{ cita.horaInicio }} – {{ cita.horaFin }}</span>
                <small>{{ fechaCitaTexto(cita.fecha) }}</small>
              </div>
              <div class="appointment-detail">
                <strong>{{ cita.clienteId?.nombre || cita.cliente || 'Cliente' }}</strong>
                <small>{{ cita.servicio || 'Servicio general' }} · {{ cita.duracionMinutos || 30 }} min</small>
                <small v-if="cita.clienteId?.telefono">Teléfono: {{ cita.clienteId.telefono }}</small>
                <small v-if="cita.clienteId?.email">Correo: {{ cita.clienteId.email }}</small>
              </div>
              <div class="appointment-response">
                <span class="status-badge" :class="`status-${cita.estado || 'confirmada'}`">
                  {{ textoEstado(cita.estado) }}
                </span>
                <div v-if="cita.estado === 'pendiente'" class="response-actions">
                  <button type="button" class="accept-button" :disabled="respondiendo === cita._id" @click="responderCita(cita, 'confirmada')">
                    Aceptar
                  </button>
                  <button type="button" class="reject-button" :disabled="respondiendo === cita._id" @click="responderCita(cita, 'rechazada')">
                    Rechazar
                  </button>
                </div>
              </div>
            </article>
          </div>
          <div v-else-if="!errorCarga" class="empty-state">
            <span class="empty-icon">🌸</span>
            <p class="text-muted luxury-subtitle">No hay citas ocupadas en esta fecha.</p>
            <span class="empty-hint">Los espacios libres aparecen arriba en el horario.</span>
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { API_URL } from '../config/api';

const hoy = new Date();
const fechaLocal = fechaAISO(hoy);
const fechaSeleccionada = ref(fechaLocal);
const fechaMinima = fechaLocal;
const inicioSemana = ref(lunesDe(fechaLocal));
const citasSemana = ref([]);
const errorCarga = ref('');
const errorHorario = ref('');
const mensajeHorario = ref('');
const horarioCargado = ref(false);
const guardandoHorario = ref(false);
const respondiendo = ref('');
const horario = ref({ diasTrabajo: [1, 2, 3, 4, 5, 6], horaInicioTrabajo: '09:00', horaFinTrabajo: '18:00' });
const diasLaborales = [
  { id: 1, nombre: 'Lun' },
  { id: 2, nombre: 'Mar' },
  { id: 3, nombre: 'Mié' },
  { id: 4, nombre: 'Jue' },
  { id: 5, nombre: 'Vie' },
  { id: 6, nombre: 'Sáb' }
];
const auth = useAuthStore();

function fechaAISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function fechaDesdeISO(valor) {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function sumarDias(fecha, cantidad) {
  const resultado = fechaDesdeISO(fecha);
  resultado.setDate(resultado.getDate() + cantidad);
  return fechaAISO(resultado);
}

function lunesDe(fecha) {
  const resultado = fechaDesdeISO(fecha);
  const diaSemana = resultado.getDay();
  resultado.setDate(resultado.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  return fechaAISO(resultado);
}

function minutosDe(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function citasDeFecha(fecha) {
  return citasSemana.value.filter((cita) => cita.fecha === fecha);
}

function citasActivasDeFecha(fecha) {
  return citasDeFecha(fecha).filter((cita) => !['rechazada', 'cancelada'].includes(cita.estado));
}

function bloquesDisponibles(fecha) {
  const dia = fechaDesdeISO(fecha).getDay();
  if (!horario.value.diasTrabajo.includes(dia)) return [];
  const citas = citasActivasDeFecha(fecha);
  const fechaHoy = fechaAISO(new Date());
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const inicioTurno = minutosDe(horario.value.horaInicioTrabajo);
  const finTurno = minutosDe(horario.value.horaFinTrabajo);
  const bloques = [];

  for (let inicio = inicioTurno; inicio + 30 <= finTurno; inicio += 30) {
    const fin = inicio + 30;
    const ocupada = citas.some((cita) =>
      minutosDe(cita.horaInicio) < fin && minutosDe(cita.horaFin) > inicio
    );
    const pasada = fecha < fechaHoy || (fecha === fechaHoy && inicio <= minutosAhora);
    bloques.push({
      inicio: `${String(Math.floor(inicio / 60)).padStart(2, '0')}:${String(inicio % 60).padStart(2, '0')}`,
      fin: `${String(Math.floor(fin / 60)).padStart(2, '0')}:${String(fin % 60).padStart(2, '0')}`,
      estado: ocupada ? 'ocupado' : pasada ? 'pasado' : 'disponible'
    });
  }
  return bloques;
}

const diasSemana = computed(() => Array.from({ length: 7 }, (_, indice) => {
  const fecha = sumarDias(inicioSemana.value, indice);
  const fechaObj = fechaDesdeISO(fecha);
  const cerrado = !horario.value.diasTrabajo.includes(fechaObj.getDay());
  return {
    fecha,
    nombre: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(fechaObj).replace('.', ''),
    numero: fechaObj.getDate(),
    cerrado,
    citas: citasActivasDeFecha(fecha).length,
    disponibles: bloquesDisponibles(fecha).filter((bloque) => bloque.estado === 'disponible').length
  };
}));

const citasDia = computed(() => citasActivasDeFecha(fechaSeleccionada.value));
const bloquesDia = computed(() => bloquesDisponibles(fechaSeleccionada.value));
const bloquesLibres = computed(() => bloquesDia.value.filter((bloque) => bloque.estado === 'disponible'));
const esDiaCerrado = computed(() => !horario.value.diasTrabajo.includes(fechaDesdeISO(fechaSeleccionada.value).getDay()));
const ocupacionDia = computed(() => {
  const minutosTurno = minutosDe(horario.value.horaFinTrabajo) - minutosDe(horario.value.horaInicioTrabajo);
  const minutosReservados = citasActivasDeFecha(fechaSeleccionada.value)
    .reduce((total, cita) => total + (Number(cita.duracionMinutos) || minutosDe(cita.horaFin) - minutosDe(cita.horaInicio)), 0);
  return {
    porcentaje: minutosTurno > 0 ? Math.min(100, Math.round(minutosReservados / minutosTurno * 100)) : 0
  };
});
const fechaSeleccionadaLarga = computed(() => new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(fechaDesdeISO(fechaSeleccionada.value)));
const rangoSemana = computed(() => {
  const fin = sumarDias(inicioSemana.value, 6);
  return `${formatearRango(inicioSemana.value)} – ${formatearRango(fin)}`;
});
const inicioSemanaActual = lunesDe(fechaLocal);
const puedeSemanaAnterior = computed(() => inicioSemana.value > inicioSemanaActual);

function formatearRango(fecha) {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(fechaDesdeISO(fecha));
}

function cambiarSemana(cantidad) {
  const nuevoInicio = sumarDias(inicioSemana.value, cantidad * 7);
  if (nuevoInicio < inicioSemanaActual) return;
  fechaSeleccionada.value = sumarDias(fechaSeleccionada.value, cantidad * 7);
  inicioSemana.value = nuevoInicio;
}

async function cargarCitasSemana() {
  try {
    const desde = inicioSemana.value;
    const hasta = sumarDias(desde, 6);
    const response = await fetch(`${API_URL}/citas?desde=${desde}&hasta=${hasta}`, {
      headers: auth.encabezadosAutenticados ? auth.encabezadosAutenticados() : {}
    });
    if (!response.ok) throw new Error('No se pudieron cargar las citas. Inicia sesión nuevamente.');
    const resultado = await response.json();
    citasSemana.value = Array.isArray(resultado) ? resultado : [];
    errorCarga.value = '';
  } catch (error) {
    citasSemana.value = [];
    errorCarga.value = 'No se pudo conectar con la agenda. Verifica que el backend esté activo en el puerto 4000.';
    console.error('Error al cargar las citas:', error);
  }
}

async function cargarHorario() {
  try {
    const response = await fetch(`${API_URL}/estilistas/mi-horario`, {
      headers: auth.encabezadosAutenticados()
    });
    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || 'No se pudo cargar tu horario laboral.');
    horario.value = {
      diasTrabajo: resultado.diasTrabajo,
      horaInicioTrabajo: resultado.horaInicioTrabajo,
      horaFinTrabajo: resultado.horaFinTrabajo
    };
    horarioCargado.value = true;
    errorHorario.value = '';
  } catch (error) {
    errorHorario.value = error.message || 'No se pudo cargar tu horario laboral.';
  }
}

async function guardarHorario() {
  guardandoHorario.value = true;
  errorHorario.value = '';
  mensajeHorario.value = '';
  try {
    const response = await fetch(`${API_URL}/estilistas/mi-horario`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth.encabezadosAutenticados() },
      body: JSON.stringify(horario.value)
    });
    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || 'No se pudo guardar el horario.');
    horario.value = resultado.horario;
    mensajeHorario.value = resultado.mensaje;
    await cargarCitasSemana();
  } catch (error) {
    errorHorario.value = error.message || 'No se pudo guardar el horario.';
  } finally {
    guardandoHorario.value = false;
  }
}

function textoEstado(estado) {
  if (estado === 'pendiente') return 'Pendiente de respuesta';
  if (estado === 'rechazada') return 'Rechazada';
  return 'Confirmada';
}

function fechaCitaTexto(fecha) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(fechaDesdeISO(fecha));
}

async function responderCita(cita, estado) {
  respondiendo.value = cita._id;
  errorCarga.value = '';
  try {
    const response = await fetch(`${API_URL}/citas/${cita._id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth.encabezadosAutenticados() },
      body: JSON.stringify({ estado })
    });
    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || 'No se pudo responder a la cita.');
    const indice = citasSemana.value.findIndex((item) => item._id === cita._id);
    if (indice !== -1) citasSemana.value[indice] = resultado.cita;
  } catch (error) {
    errorCarga.value = error.message || 'No se pudo responder a la cita.';
  } finally {
    respondiendo.value = '';
  }
}

watch(fechaSeleccionada, (fecha) => {
  const nuevaSemana = lunesDe(fecha);
  if (nuevaSemana !== inicioSemana.value) inicioSemana.value = nuevaSemana;
});
watch(inicioSemana, cargarCitasSemana);
onMounted(() => {
  cargarHorario();
  cargarCitasSemana();
});
</script>

<style scoped>
.esther-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* Fondo con imagen de peluquería y gradiente refinado */
.salon-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(252, 251, 249, 0.82), rgba(252, 251, 249, 0.88)), 
                    url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920');
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.agenda-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 950px;
}

.sub-title-badge {
  display: inline-block;
  font-size: 0.85rem;
  letter-spacing: 2px;
  color: #b3637e;
  text-transform: uppercase;
  font-weight: 600;
  background: rgba(216, 131, 158, 0.1);
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid rgba(216, 131, 158, 0.2);
}

.luxury-heading {
  font-family: 'Playfair Display', serif;
  letter-spacing: -0.5px;
}

.luxury-subtitle {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.05rem;
}

.text-dark {
  color: #232023 !important;
}

.text-pink {
  color: #b3637e !important;
}

.text-muted {
  color: #5c5559 !important;
}

.service-detail { display: block; margin-top: 4px; color: #766a6d; font-size: .82rem; font-weight: 400; }
.load-error { margin: 0 0 16px; color: #a32d3d; }
.form-success { margin: 8px 0 0; color: #28764b; }
.busy-warning, .busy-notice { margin: 0 0 16px; padding: 12px 15px; border-radius: 10px; font-weight: 600; }
.busy-warning { background: #fff0ed; color: #a54130; }
.busy-notice { background: #fff8e8; color: #805d19; }
.work-hours-controls { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.work-days { display: flex; flex-wrap: wrap; gap: 8px; }
.work-day-option { position: relative; }
.work-day-option input { position: absolute; opacity: 0; }
.work-day-option span { display: block; padding: 9px 13px; border: 1px solid #ead5dd; border-radius: 10px; color: #695c61; cursor: pointer; }
.work-day-option input:checked + span { border-color: #b3637e; background: #fff1f5; color: #8f455e; font-weight: 700; }
.work-day-option input:focus-visible + span { outline: 2px solid #b3637e; outline-offset: 2px; }
.work-time-controls { display: flex; gap: 12px; }
.work-time-controls label { display: grid; gap: 5px; color: #766a6d; font-size: .82rem; }
.work-time-controls input { padding: 8px; border: 1px solid #ead5dd; border-radius: 9px; background: #fffafb; color: #393236; font: inherit; }
.save-hours-button { min-height: 40px; padding: 9px 15px; border: 0; border-radius: 10px; background: #8f455e; color: #fff; font-weight: 700; cursor: pointer; }
.save-hours-button:disabled { opacity: .55; cursor: wait; }
.calendar-card, .schedule-card, .appointments-card { margin-bottom: 20px; }
.calendar-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.week-caption, .selected-date { margin: 5px 0 0; color: #766a6d; font-size: .9rem; text-transform: capitalize; }
.calendar-actions { display: flex; align-items: center; gap: 10px; }
.week-button { width: 40px; height: 40px; border: 1px solid #ead5dd; border-radius: 11px; background: #fff8fa; color: #8f455e; font-size: 1.5rem; line-height: 1; cursor: pointer; }
.week-button:disabled { opacity: .4; cursor: not-allowed; }
.week-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }
.day-button { display: grid; justify-items: center; gap: 5px; min-height: 114px; padding: 12px 6px; border: 1px solid #f0e1e7; border-radius: 14px; background: #fff; color: #5c5559; cursor: pointer; transition: .2s ease; }
.day-button:hover, .day-button.selected { border-color: #b3637e; background: #fff4f7; }
.day-name { color: #8a747c; font-size: .75rem; text-transform: capitalize; }
.day-number { color: #30282c; font-size: 1.25rem; }
.day-availability { color: #28764b; font-size: .72rem; font-weight: 700; text-align: center; }
.day-appointments { color: #766a6d; font-size: .68rem; }
.day-button.closed { background: #f6f3f4; }
.day-button.closed .day-availability { color: #81787b; }
.availability-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 9px; }
.availability-slot { display: grid; gap: 3px; min-height: 82px; padding: 11px 8px; border: 1px solid #d7ebde; border-radius: 11px; background: #f3fbf5; text-align: center; }
.availability-slot strong { color: #2d6140; font-size: .9rem; }
.availability-slot span, .availability-slot small { color: #64736a; font-size: .73rem; }
.availability-slot.ocupado { border-color: #efd4dc; background: #fff3f6; }
.availability-slot.ocupado strong, .availability-slot.ocupado small { color: #a34d68; }
.availability-slot.pasado { border-color: #e5e0e2; background: #f2f0f1; }
.availability-slot.pasado strong, .availability-slot.pasado small { color: #827a7e; }
.legend { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 18px; color: #6b6266; font-size: .82rem; }
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-dot.free { background: #56a871; }
.legend-dot.busy { background: #c46a85; }
.closed-state { padding: 28px; border-radius: 12px; background: #f6f3f4; color: #766a6d; text-align: center; }
.appointment-list { display: grid; gap: 10px; }
.appointment-row { display: grid; grid-template-columns: 1fr 1.4fr 1.4fr; gap: 16px; align-items: center; padding: 15px; border: 1px solid #f0e1e7; border-radius: 13px; background: #fcf9fb; }
.appointment-detail { display: grid; gap: 4px; color: #30282c; overflow-wrap: anywhere; }
.appointment-detail small { color: #766a6d; }
.appointment-time { display: grid; justify-items: start; gap: 7px; color: #766a6d; font-size: .83rem; text-transform: capitalize; }
.appointment-response { display: grid; justify-items: start; gap: 8px; }
.status-badge { display: inline-block; padding: 6px 10px; border-radius: 20px; font-size: .75rem; font-weight: 700; }
.status-pendiente { background: #fff4dc; color: #78550a; }
.status-confirmada { background: #eaf7ee; color: #28764b; }
.status-rechazada { background: #f6e9ec; color: #954458; }
.response-actions { display: flex; flex-wrap: wrap; gap: 7px; }
.accept-button, .reject-button { padding: 7px 10px; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; }
.accept-button { background: #e7f5ec; color: #28764b; }
.reject-button { background: #fff0f2; color: #a32d3d; }
.accept-button:disabled, .reject-button:disabled { opacity: .55; cursor: wait; }
.empty-state { text-align: center; padding: 38px 20px; }
.empty-icon { display: block; margin-bottom: 10px; font-size: 2.5rem; }
.empty-hint { display: block; margin-top: 6px; color: #9c9096; font-size: .82rem; }

@media (max-width: 760px) {
  .esther-page { padding: 24px 14px; }
  .esther-card { padding: 22px 16px; }
  .calendar-toolbar { align-items: flex-start; flex-direction: column; }
  .calendar-actions { width: 100%; }
  .date-input-luxury { flex: 1; max-width: none; }
  .week-days { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .availability-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .appointment-row { grid-template-columns: 1fr; gap: 9px; }
  .work-hours-controls { align-items: stretch; flex-direction: column; }
  .work-time-controls { flex-wrap: wrap; }
}

@media (max-width: 420px) {
  .week-days { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .availability-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* Tarjetas con efectos de cristal y bordes delicados */
.esther-card {
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(216, 131, 158, 0.25);
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 15px 40px rgba(179, 99, 126, 0.08);
}

.date-card {
  padding: 20px 32px;
}

.luxury-label {
  letter-spacing: 0.5px;
  font-size: 0.95rem;
}

.date-input-luxury {
  max-width: 210px;
  background-color: #fff9fb;
  border: 1px solid rgba(216, 131, 158, 0.3);
  color: #232023;
  padding: 10px 16px;
  border-radius: 12px;
  outline: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.date-input-luxury:focus {
  border-color: #b3637e;
  box-shadow: 0 0 0 4px rgba(216, 131, 158, 0.15);
}

.badge-count {
  font-size: 0.8rem;
  background-color: #fff4f7;
  color: #b3637e;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(216, 131, 158, 0.2);
  font-weight: 600;
}

.table-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-header {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 1.4fr;
  padding: 14px 20px;
  font-size: 0.8rem;
  color: #b3637e;
  font-weight: 700;
  border-bottom: 2px solid #f2e6ec;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.table-row {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 1.4fr;
  padding: 18px 20px;
  background-color: #fcf9fb;
  border: 1px solid #f0e1e7;
  border-radius: 14px;
  align-items: center;
  transition: all 0.3s ease;
}

.table-row:hover {
  background-color: #fff5f8;
  border-color: #d8839e;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(216, 131, 158, 0.1);
}

.time-badge {
  background: rgba(216, 131, 158, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
  width: fit-content;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.empty-hint {
  display: block;
  font-size: 0.8rem;
  color: #9c9096;
  margin-top: 6px;
}
</style>