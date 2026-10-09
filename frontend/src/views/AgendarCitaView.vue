<template>
  <q-page class="esther-page q-pa-xl flex flex-center">
    <div class="salon-background"></div>

    <div class="form-wrapper">
      <div class="text-center q-mb-xl">
        <span class="sub-title-badge">✨ Reservaciones ✨</span>
        <h1 class="luxury-heading text-h3 text-weight-bold text-dark q-mt-sm q-mb-xs">Agendar cita</h1>
        <p class="text-subtitle1 text-muted luxury-subtitle">Consulta la agenda semanal de los estilistas y elige un horario disponible.</p>
      </div>

      <div class="esther-card">
        <p v-if="errorCarga" class="form-error" role="alert">{{ errorCarga }}</p>
        <form v-else class="esther-form" @submit.prevent="registrarCita">
          <div class="profile-note">Reservando como <strong>{{ auth.usuario?.nombre || 'Cliente' }}</strong></div>

          <div class="input-group">
            <label class="input-label">1. ¿Qué servicio quieres agendar?</label>
            <select v-model="form.servicioId" class="luxury-input" required>
              <option disabled value="">Seleccione un servicio...</option>
              <option v-for="servicio in servicios" :key="servicio.id" :value="servicio.id">
                {{ servicio.nombre }} - ${{ servicio.precio }} ({{ servicio.duracionMinutos }} min)
              </option>
            </select>
            <div v-if="servicioSeleccionado" class="service-preview">
              <strong>{{ servicioSeleccionado.categoria }}</strong>
              <span>{{ servicioSeleccionado.descripcion }}</span>
              <span><b>Incluye:</b> {{ servicioSeleccionado.incluye.join(' · ') }}</span>
              <router-link to="/servicios">Ver todos los servicios y sus detalles</router-link>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">2. ¿Qué día te queda bien?</label>
            <input type="date" v-model="form.fecha" :min="fechaMinima" class="luxury-input" required />
          </div>

          <div class="input-group">
            <label class="input-label">3. Elige el estilista</label>
            <select v-model="form.estilistaId" class="luxury-input" :disabled="!servicioSeleccionado || !estilistasDisponibles.length" required>
              <option disabled value="">Selecciona un estilista para consultar su turno...</option>
              <option v-for="estilista in estilistasDisponibles" :key="estilista._id" :value="estilista._id">
                {{ estilista.nombre }} · {{ estilista.especialidad }} ·
                {{ diasTexto(estilista.diasTrabajo || [1, 2, 3, 4, 5, 6]) }} ·
                {{ estilista.horaInicioTrabajo || '09:00' }}–{{ estilista.horaFinTrabajo || '18:00' }}
              </option>
            </select>
            <span v-if="servicioSeleccionado && estilistasDisponibles.length === 0" class="form-error" role="status">
              Por ahora no hay un estilista con especialidad en {{ servicioSeleccionado.nombre }}. Elige otro servicio o consulta más tarde.
            </span>
            <span v-else-if="!form.estilistaId" class="status-help">
              Al elegirlo, verás sus horas libres para el servicio y la fecha seleccionados.
            </span>
          </div>

          <section v-if="form.servicioId && form.estilistaId" class="weekly-agenda" aria-live="polite">
            <div class="weekly-agenda-heading">
              <div>
                <h2>Agenda semanal de {{ estilistaSeleccionado?.nombre }}</h2>
                <p>Solo se muestran los horarios disponibles; las citas de otras personas son privadas.</p>
              </div>
              <div class="week-navigation">
                <button type="button" aria-label="Semana anterior" @click="moverSemana(-7)">‹</button>
                <span>{{ rangoSemana }}</span>
                <button type="button" aria-label="Semana siguiente" @click="moverSemana(7)">›</button>
              </div>
            </div>
            <p v-if="cargandoAgendaSemanal" class="availability-message">Consultando la agenda de la semana...</p>
            <p v-else-if="errorAgendaSemanal" class="form-error" role="alert">{{ errorAgendaSemanal }}</p>
            <div v-else class="weekly-agenda-days">
              <button
                v-for="dia in diasAgendaSemanal"
                :key="dia.fecha"
                type="button"
                class="weekly-agenda-day"
                :class="{ selected: form.fecha === dia.fecha, disabled: dia.pasado || !dia.horarios.length }"
                :disabled="dia.pasado"
                @click="form.fecha = dia.fecha"
              >
                <strong>{{ dia.nombre }}</strong>
                <span v-if="dia.pasado" class="weekly-agenda-empty">Pasado</span>
                <template v-else-if="dia.horarios.length">
                  <span class="weekly-agenda-count">{{ dia.horarios.length }} {{ dia.horarios.length === 1 ? 'horario libre' : 'horarios libres' }}</span>
                  <span class="weekly-agenda-slots">{{ dia.horarios.map((slot) => slot.horaInicio).join(' · ') }}</span>
                </template>
                <span v-else class="weekly-agenda-empty">{{ dia.consultado ? 'Sin horarios libres' : 'No disponible' }}</span>
              </button>
            </div>
          </section>

          <div v-if="disponibilidad" class="availability-summary">
            <strong>Turno de {{ estilistaSeleccionado?.nombre }}:</strong>
            {{ diasTexto(disponibilidad.horario.diasTrabajo) }},
            {{ disponibilidad.horario.horaInicio }}–{{ disponibilidad.horario.horaFin }}.
            <span>{{ disponibilidad.ocupacion.citas }} citas y {{ disponibilidad.ocupacion.porcentaje }}% del turno ocupado.</span>
          </div>

          <p v-if="cargandoDisponibilidad" class="availability-message">Consultando la agenda del estilista y tus horarios...</p>
          <p v-else-if="avisoAgenda" class="busy-warning" role="status">{{ avisoAgenda }}</p>

          <div class="input-group">
            <label class="input-label">Horario de inicio y disponibilidad</label>
            <select v-model="form.horaInicio" class="luxury-input" :disabled="cargandoDisponibilidad || !disponibilidad?.slots.length" required>
              <option disabled value="">Selecciona un horario...</option>
              <option
                v-for="slot in disponibilidad?.slots || []"
                :key="slot.horaInicio"
                :value="slot.horaInicio"
                :disabled="!slot.disponible"
              >
                {{ slot.horaInicio }}–{{ slot.horaFin }} · {{ slot.disponible ? 'Disponible' : slot.motivos.join(' ') }}
              </option>
            </select>
          </div>

          <p v-if="slotSeleccionado?.disponible" class="availability-message success-message" role="status">
            {{ estilistaSeleccionado.nombre }} tiene libre de {{ slotSeleccionado.horaInicio }} a {{ slotSeleccionado.horaFin }},
            y tu agenda también está libre. La solicitud queda pendiente de aceptación del estilista.
          </p>
          <p v-else-if="form.horaInicio && slotSeleccionado" class="form-error" role="alert">
            {{ slotSeleccionado.motivos.join(' ') }}
          </p>
          <p v-if="availabilityError" class="form-error" role="alert">{{ availabilityError }}</p>
          <div v-if="mensaje" class="booking-success" role="status" aria-live="polite">
            <strong>¡Cita creada correctamente!</strong>
            <span>{{ mensaje }}</span>
          </div>
          <p v-if="errorReserva" class="form-error" role="alert">{{ errorReserva }}</p>

          <section v-if="slotSeleccionado?.disponible && servicioSeleccionado && estilistaSeleccionado" class="booking-summary" aria-live="polite">
            <h2>Resumen de tu cita</h2>
            <p><strong>Servicio:</strong> {{ servicioSeleccionado.nombre }} ({{ servicioSeleccionado.duracionMinutos }} min)</p>
            <p><strong>Fecha:</strong> {{ form.fecha }}</p>
            <p><strong>Horario:</strong> {{ slotSeleccionado.horaInicio }}–{{ slotSeleccionado.horaFin }}</p>
            <p><strong>Estilista:</strong> {{ estilistaSeleccionado.nombre }} · {{ estilistaSeleccionado.especialidad }}</p>
          </section>

          <div class="q-mt-xl">
            <button
              type="submit"
              class="btn-esther full-width"
              :disabled="guardando || cargandoDisponibilidad || !slotSeleccionado?.disponible"
            >
              {{ guardando ? 'Enviando solicitud...' : 'Solicitar cita al estilista' }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { API_URL } from '../config/api';
import { normalizarEspecialidad, presentarServicio } from '../config/servicios';

const auth = useAuthStore();

const servicios = ref([]);
const estilistas = ref([]);
const disponibilidad = ref(null);
const errorCarga = ref('');
const availabilityError = ref('');
const errorReserva = ref('');
const mensaje = ref('');
const avisoAgenda = ref('');
const cargandoDisponibilidad = ref(false);
const agendaSemanal = ref([]);
const cargandoAgendaSemanal = ref(false);
const errorAgendaSemanal = ref('');
const guardando = ref(false);
let solicitudDisponibilidad = 0;
let solicitudAgendaSemanal = 0;
const hoy = new Date();
const fechaMinima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

const form = ref({ servicioId: '', estilistaId: '', fecha: fechaMinima, horaInicio: '' });

const servicioSeleccionado = computed(() => servicios.value.find((servicio) => servicio.id === form.value.servicioId));
const estilistasDisponibles = computed(() => {
  if (!servicioSeleccionado.value) return [];
  const servicioNormalizado = normalizarEspecialidad(servicioSeleccionado.value.nombre);
  return estilistas.value.filter((estilista) =>
    normalizarEspecialidad(estilista.especialidad) === servicioNormalizado
  );
});
const estilistaSeleccionado = computed(() => estilistasDisponibles.value.find((estilista) => estilista._id === form.value.estilistaId));
const slotSeleccionado = computed(() => disponibilidad.value?.slots.find((slot) => slot.horaInicio === form.value.horaInicio));
const fechaInicioSemana = computed(() => {
  const [anio, mes, dia] = (form.value.fecha || fechaMinima).split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7));
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
});
const diasAgendaSemanal = computed(() => {
  const [anio, mes, dia] = fechaInicioSemana.value.split('-').map(Number);
  const lunes = new Date(anio, mes - 1, dia);
  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + indice);
    const fechaTexto = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const datos = agendaSemanal.value.find((diaAgenda) => diaAgenda.fecha === fechaTexto);
    return {
      fecha: fechaTexto,
      nombre: new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: '2-digit', month: 'short' }).format(fecha),
      pasado: fechaTexto < fechaMinima,
      consultado: Boolean(datos),
      horarios: datos?.disponibilidad?.slots.filter((slot) => slot.disponible) || []
    };
  });
});
const rangoSemana = computed(() => {
  const primerDia = diasAgendaSemanal.value[0];
  const ultimoDia = diasAgendaSemanal.value[6];
  return `${primerDia.nombre} – ${ultimoDia.nombre}`;
});

async function cargarOpciones() {
  const [respuestaServicios, respuestaEstilistas] = await Promise.all([
    fetch(`${API_URL}/servicios`),
    fetch(`${API_URL}/estilistas`, { headers: auth.encabezadosAutenticados() })
  ]);
  if (!respuestaServicios.ok || !respuestaEstilistas.ok) {
    throw new Error('No se pudieron cargar los servicios y estilistas.');
  }
  servicios.value = (await respuestaServicios.json()).map(presentarServicio);
  estilistas.value = await respuestaEstilistas.json();
  if (!estilistas.value.length) throw new Error('Todavía no hay estilistas con una cuenta activa para recibir citas.');
}

watch(() => form.value.servicioId, () => {
  if (form.value.estilistaId && !estilistasDisponibles.value.some((estilista) => estilista._id === form.value.estilistaId)) {
    form.value.estilistaId = '';
  }
});

function moverSemana(dias) {
  const [anio, mes, dia] = fechaInicioSemana.value.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setDate(fecha.getDate() + dias);
  form.value.fecha = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function diasTexto(dias) {
  const nombres = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return dias.map((dia) => nombres[dia]).join(', ');
}

async function cargarAgendaSemanal() {
  const numeroSolicitud = ++solicitudAgendaSemanal;
  errorAgendaSemanal.value = '';
  if (!form.value.servicioId || !form.value.estilistaId) {
    agendaSemanal.value = [];
    cargandoAgendaSemanal.value = false;
    return;
  }

  cargandoAgendaSemanal.value = true;
  try {
    const semana = await Promise.all(diasAgendaSemanal.value.map(async (dia) => {
      if (dia.pasado) return { fecha: dia.fecha, disponibilidad: null };
      const parametros = new URLSearchParams({
        fecha: dia.fecha,
        servicioId: form.value.servicioId,
        estilistaId: form.value.estilistaId
      });
      const response = await fetch(`${API_URL}/disponibilidad?${parametros}`, {
        headers: auth.encabezadosAutenticados()
      });
      const resultado = await response.json();
      if (!response.ok) throw new Error(resultado.error || 'No se pudo cargar la agenda semanal.');
      return { fecha: dia.fecha, disponibilidad: resultado };
    }));
    if (numeroSolicitud === solicitudAgendaSemanal) agendaSemanal.value = semana;
  } catch (error) {
    if (numeroSolicitud === solicitudAgendaSemanal) {
      errorAgendaSemanal.value = error.message || 'No se pudo cargar la agenda semanal.';
    }
  } finally {
    if (numeroSolicitud === solicitudAgendaSemanal) cargandoAgendaSemanal.value = false;
  }
}

async function consultarDisponibilidad() {
  const numeroSolicitud = ++solicitudDisponibilidad;
  form.value.horaInicio = '';
  disponibilidad.value = null;
  availabilityError.value = '';
  avisoAgenda.value = '';
  mensaje.value = '';
  errorReserva.value = '';
  if (!form.value.servicioId || !form.value.estilistaId || !form.value.fecha) {
    cargandoDisponibilidad.value = false;
    return;
  }

  cargandoDisponibilidad.value = true;
  try {
    const parametros = new URLSearchParams({
      fecha: form.value.fecha,
      servicioId: form.value.servicioId,
      estilistaId: form.value.estilistaId
    });
    const response = await fetch(`${API_URL}/disponibilidad?${parametros}`, {
      headers: auth.encabezadosAutenticados()
    });
    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || 'No se pudo consultar la agenda.');
    if (numeroSolicitud !== solicitudDisponibilidad) return;
    disponibilidad.value = resultado;
    if (resultado.ocupacion.nivel === 'muy_llena') {
      avisoAgenda.value = `La agenda de ${estilistaSeleccionado.value?.nombre} está muy llena (${resultado.ocupacion.porcentaje}% ocupado). Solo podrás seleccionar los horarios que todavía estén libres.`;
    } else if (resultado.ocupacion.nivel === 'ocupada') {
      avisoAgenda.value = `La agenda está ocupada en un ${resultado.ocupacion.porcentaje}% del turno. Revisa los horarios libres antes de solicitar.`;
    } else if (!resultado.slots.some((slot) => slot.disponible)) {
      avisoAgenda.value = 'No quedan horarios que coincidan con la duración del servicio y la disponibilidad del cliente y el estilista.';
    }
  } catch (error) {
    if (numeroSolicitud === solicitudDisponibilidad) {
      availabilityError.value = error.message || 'No se pudo consultar la disponibilidad.';
    }
  } finally {
    if (numeroSolicitud === solicitudDisponibilidad) cargandoDisponibilidad.value = false;
  }
}

async function registrarCita() {
  if (guardando.value || !slotSeleccionado.value?.disponible) return;
  guardando.value = true;
  errorReserva.value = '';
  mensaje.value = '';
  try {
    const response = await fetch(`${API_URL}/citas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        ...(auth.encabezadosAutenticados ? auth.encabezadosAutenticados() : {}) 
      },
      body: JSON.stringify({
        servicioId: form.value.servicioId,
        estilistaId: form.value.estilistaId,
        fecha: form.value.fecha,
        horaInicio: form.value.horaInicio
      })
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("El backend no tiene configurada la ruta POST /api/citas o devuelve HTML.");
    }

    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || 'No se pudo agendar la cita');

    await Promise.all([consultarDisponibilidad(), cargarMisCitas()]);
    mensaje.value = 'Tu solicitud quedó pendiente de aceptación del estilista.';
  } catch (error) {
    await consultarDisponibilidad();
    errorReserva.value = error.message || 'No se pudo conectar con el servidor.';
  } finally {
    guardando.value = false;
  }
}

watch(
  () => [form.value.servicioId, form.value.estilistaId, form.value.fecha],
  consultarDisponibilidad
);

watch(
  () => [form.value.servicioId, form.value.estilistaId, fechaInicioSemana.value],
  cargarAgendaSemanal
);

onMounted(async () => {
  try {
    await cargarOpciones();
  } catch (error) {
    errorCarga.value = error.message || 'No se pudieron cargar los datos de reserva.';
  }
});
</script>

<style scoped>
.esther-page { position: relative; min-height: 100vh; overflow: hidden; }
.salon-background {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-image: linear-gradient(rgba(252, 251, 249, 0.82), rgba(252, 251, 249, 0.88)), 
                    url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920');
  background-size: cover; background-position: center; z-index: 1;
}
.form-wrapper { position: relative; z-index: 2; width: 100%; max-width: 1000px; padding: 20px 0; }
.sub-title-badge {
  display: inline-block; font-size: 0.85rem; letter-spacing: 2px; color: #b3637e; text-transform: uppercase; font-weight: 600;
  background: rgba(216, 131, 158, 0.1); padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(216, 131, 158, 0.2);
}
.luxury-heading { font-family: 'Playfair Display', serif; letter-spacing: -0.5px; color: #232023; }
.luxury-subtitle { font-family: 'Playfair Display', serif; font-style: italic; color: #5c5559; }
.esther-card {
  background-color: rgba(255, 255, 255, 0.96); backdrop-filter: blur(12px);
  border: 1px solid rgba(216, 131, 158, 0.25); border-radius: 20px; padding: 40px; box-shadow: 0 15px 40px rgba(179, 99, 126, 0.08);
}
.esther-form { display: flex; flex-direction: column; gap: 20px; }
.profile-note { padding: 12px 16px; border-left: 3px solid #b3637e; background: #fff4f7; color: #5c5559; }
.time-error { margin: -12px 0 0; color: #a32d3d; font-size: 0.9rem; }
.form-error { margin: 0; color: #a32d3d; font-size: .9rem; line-height: 1.5; }
.availability-summary { display: grid; gap: 5px; padding: 13px 16px; border: 1px solid #e9d8de; border-radius: 11px; background: #fff9fb; color: #554b4a; font-size: .9rem; }
.weekly-agenda { display: grid; gap: 16px; padding: 18px; border: 1px solid #ead5dd; border-radius: 14px; background: #fffafb; }
.weekly-agenda-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.weekly-agenda-heading h2 { margin: 0; color: #8f455e; font: 700 1.1rem 'Playfair Display', Georgia, serif; }
.weekly-agenda-heading p { margin: 5px 0 0; color: #766a6d; font-size: .82rem; }
.week-navigation { display: flex; align-items: center; gap: 10px; color: #62585c; font-size: .82rem; white-space: nowrap; }
.week-navigation button { width: 32px; height: 32px; border: 1px solid #ead5dd; border-radius: 50%; background: white; color: #8f455e; font-size: 1.2rem; cursor: pointer; }
.weekly-agenda-days { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.weekly-agenda-day { display: grid; align-content: start; gap: 8px; min-height: 116px; padding: 12px; border: 1px solid #ead5dd; border-radius: 11px; background: white; color: #554b4a; text-align: left; cursor: pointer; }
.weekly-agenda-day.selected { border-color: #b3637e; box-shadow: 0 0 0 2px rgba(179, 99, 126, .12); }
.weekly-agenda-day.disabled { background: #f8f5f6; color: #958b8f; cursor: default; }
.weekly-agenda-count { color: #28764b; font-size: .78rem; font-weight: 700; }
.weekly-agenda-slots { color: #62585c; font-size: .75rem; line-height: 1.5; overflow-wrap: anywhere; }
.weekly-agenda-empty { color: #766a6d; font-size: .78rem; }
.availability-message { margin: 0; color: #62585c; font-size: .9rem; line-height: 1.5; }
.service-preview { display: grid; gap: 7px; padding: 13px 15px; border: 1px solid #ead5dd; border-radius: 11px; background: #fffafb; color: #5c5559; font-size: .87rem; line-height: 1.5; }
.service-preview strong { color: #8f455e; font-size: .74rem; letter-spacing: .8px; }
.service-preview a { color: #8f455e; font-weight: 700; }
.booking-summary { padding: 16px; border: 1px solid #d6eadc; border-radius: 12px; background: #f3fbf5; color: #365340; }
.booking-summary h2 { margin: 0 0 10px; font-size: 1rem; }
.booking-summary p { margin: 5px 0; font-size: .9rem; }
.booking-success { display: grid; gap: 5px; padding: 14px 16px; border: 1px solid #b9dfc5; border-radius: 11px; background: #f0faf3; color: #28764b; line-height: 1.5; }
.booking-success strong { font-size: 1rem; }
.booking-success span { font-size: .9rem; }
.busy-warning { margin: 0; padding: 12px 14px; border-radius: 10px; background: #fff2e4; color: #835415; font-size: .9rem; line-height: 1.5; }
.success-message { color: #28764b; line-height: 1.5; }
.my-appointments { margin-top: 22px; }
.appointments-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
.appointments-heading h2 { margin: 0; }
.status-help { color: #766a6d; font-size: .85rem; }
.my-appointment-list { display: grid; gap: 10px; }
.my-appointment-row { display: grid; grid-template-columns: 1fr 1.5fr auto; align-items: center; gap: 12px; padding: 13px; border: 1px solid #f0e1e7; border-radius: 11px; color: #4e4549; font-size: .88rem; }
.status-badge { display: inline-block; width: fit-content; padding: 6px 10px; border-radius: 20px; font-size: .75rem; font-weight: 700; }
.status-pendiente { background: #fff4dc; color: #78550a; }
.status-confirmada { background: #eaf7ee; color: #28764b; }
.status-rechazada { background: #f6e9ec; color: #954458; }
.input-group { display: flex; flex-direction: column; gap: 8px; }
.input-label { font-size: 0.9rem; color: #b3637e; font-weight: 600; letter-spacing: 0.5px; }
.luxury-input {
  background-color: #fff9fb; border: 1px solid rgba(216, 131, 158, 0.3); color: #232023;
  padding: 12px 16px; border-radius: 12px; outline: none; font-size: 0.95rem; transition: all 0.3s ease; width: 100%;
}
.luxury-input:focus { border-color: #b3637e; box-shadow: 0 0 0 4px rgba(216, 131, 158, 0.15); background-color: #ffffff; }
.btn-esther {
  background: linear-gradient(135deg, #d8839e 0%, #b3637e 100%); color: white; border: none; padding: 14px;
  border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 6px 20px rgba(216, 131, 158, 0.3);
}
.btn-esther:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(216, 131, 158, 0.4); }
.btn-esther:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
.full-width { width: 100%; }
@media (max-width: 600px) {
  .esther-card { padding: 24px 18px; }
  .weekly-agenda-heading { align-items: flex-start; flex-direction: column; }
  .weekly-agenda-days { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .weekly-agenda-day { min-height: 100px; padding: 10px; }
}
</style>