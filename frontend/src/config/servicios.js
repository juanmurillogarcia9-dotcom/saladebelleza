const presentacionServicios = {
  '1': {
    categoria: 'ESTILO Y ASESORÍA',
    descripcion: 'Renueva tu look con un corte pensado para la forma de tu rostro, tu tipo de cabello y el estilo que quieres llevar.',
    incluye: ['Asesoría personalizada de estilo', 'Lavado y corte profesional', 'Secado y peinado final'],
    imagen: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=900'
  },
  '2': {
    categoria: 'COLOR E ILUMINACIÓN',
    descripcion: 'Dale luz y dimensión a tu cabello con una técnica de color personalizada, cuidando la armonía con tu tono y tu estilo.',
    incluye: ['Orientación para elegir tonos', 'Aplicación de color o balayage', 'Cuidado y acabado del cabello'],
    imagen: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=900'
  },
  '3': {
    categoria: 'CUIDADO DE MANOS Y PIES',
    descripcion: 'Regálate un momento de cuidado y descanso mientras dejamos tus manos y pies limpios, suaves y con un acabado impecable.',
    incluye: ['Limpieza y cuidado de uñas', 'Cuidado de cutículas y exfoliación', 'Esmaltado y acabado a elección'],
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=900'
  },
  '4': {
    categoria: 'BELLEZA Y OCASIONES ESPECIALES',
    descripcion: 'Un maquillaje profesional adaptado a la ocasión, tus facciones y el estilo que deseas lucir.',
    incluye: ['Preparación de la piel', 'Selección de tonos y estilo', 'Maquillaje y acabado profesional'],
    imagen: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=900'
  },
  '5': {
    categoria: 'SUAVIDAD Y BRILLO',
    descripcion: 'Tratamiento de keratina para ayudar a controlar el frizz y dejar el cabello con una apariencia más suave, brillante y manejable.',
    incluye: ['Evaluación del cabello', 'Aplicación del tratamiento', 'Secado y recomendaciones de cuidado'],
    imagen: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=900'
  }
}

export function presentarServicio(servicio) {
  return { ...servicio, ...presentacionServicios[String(servicio.id)] }
}

export function normalizarEspecialidad(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es')
}
