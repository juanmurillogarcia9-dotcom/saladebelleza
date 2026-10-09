require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

async function comprobarRuta(ruta, opciones, estadoEsperado) {
  const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  const contenido = await respuesta.json();
  if (respuesta.status !== estadoEsperado) {
    throw new Error(`${ruta}: se esperaba HTTP ${estadoEsperado}, se recibió HTTP ${respuesta.status}.`);
  }
  return contenido;
}

async function probarSistema() {
  const servicios = await comprobarRuta('/servicios', {}, 200);
  if (!Array.isArray(servicios) || servicios.length === 0) {
    throw new Error('El catálogo de servicios no devolvió datos.');
  }

  const estilistas = await comprobarRuta('/estilistas', {}, 200);
  if (!Array.isArray(estilistas)) {
    throw new Error('El endpoint de estilistas no devolvió una lista.');
  }

  await comprobarRuta('/citas', {}, 401);
  await comprobarRuta('/disponibilidad', {}, 401);
  await comprobarRuta('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }, 400);

  console.log('API disponible; servicios y estilistas cargan correctamente.');
  console.log('Citas y disponibilidad están protegidas y el registro valida los datos requeridos.');
  console.log('Comprobación de solo lectura: no se crearon cuentas ni citas en Atlas.');
}

probarSistema().catch((error) => {
  console.error('La comprobación de la API falló:', error.message);
  process.exitCode = 1;
});
