import './style.css'
import { bootstrap } from './app/bootstrap.js'
import { registerSW } from './app/pwa/registerSW.js'


bootstrap().catch((err) => {
  console.error(err)
  const app = document.querySelector('#app')
  if (app) app.textContent = 'Boot error. Check console.'
})

registerSW()