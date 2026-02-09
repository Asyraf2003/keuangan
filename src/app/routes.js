// src/app/routes.js
import { renderHome } from '../pages/home.js'
import { renderHistory } from '../pages/history.js'
import { renderAdd } from '../pages/add.js'
import { renderAccount } from '../pages/account.js'
import { renderReport } from '../pages/report.js'

export const routes = {
  '/home': renderHome,
  '/history': renderHistory,
  '/add': renderAdd,
  '/report': renderReport,
  '/reports': renderReport,
  '/laporan': renderReport,
  '/account': renderAccount,
}
