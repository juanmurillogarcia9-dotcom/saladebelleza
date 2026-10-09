const apiUrlConfigurada = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

export const API_URL = apiUrlConfigurada
  ? apiUrlConfigurada.endsWith('/api')
    ? apiUrlConfigurada
    : `${apiUrlConfigurada}/api`
  : 'http://localhost:4000/api'
