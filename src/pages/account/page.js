import { clear, el } from '../../shared/dom.js'
import { getMeta } from '../../infra/repos/metaRepo.js'

import { getActiveBalancesMap } from '../../application/balance/activeBalances.js'
import { reconcileWalletBalance } from '../../application/wallets/reconcileWalletBalance.js'

import { getWallets } from '../../application/wallets/getWallets.js'
import { createWallet } from '../../application/wallets/createWallet.js'
import { archiveWallet } from '../../application/wallets/archiveWallet.js'

import { getCategories } from '../../application/categories/getCategories.js'
import { createCategory } from '../../application/categories/createCategory.js'
import { archiveCategory } from '../../application/categories/archiveCategory.js'

import { Badge } from '../../ui/components/badge.js'
import {
  WALLET_ICONS, INCOME_ICONS, EXPENSE_ICONS,
  randomWalletAppearance, randomCategoryAppearance
} from '../../domain/appearance.js'

function norm(s) { return String(s || '').trim().toLowerCase() }
function isLockedCategoryName(name) {
  const n = norm(name)
  return n === 'lainnya' || n === 'biaya lainnya'
}
function fmt(n) { return new Intl.NumberFormat('id-ID').format(n) }

function fillIconOptions(selectEl, icons, selected) {
  selectEl.replaceChildren(...icons.map(ic => el('option', { attrs: { value: ic }, text: ic })))
  if (selected) selectEl.value = selected
}

export function renderAccount(outlet) {
  clear(outlet)

  const wrap = el('div', { class: 'card' },
    el('h1', { class: 'h1', text: 'Akun' }),
    el('p', { class: 'p', text: 'Loading…' }),
  )
  outlet.append(wrap)

  ;(async () => {
    const deviceId = await getMeta('device_id')

    let tab = 'wallets' // wallets | categories
    let showArchivedWallets = false
    let showArchivedCats = false

    const content = el('div', { attrs: { style: 'margin-top:12px;' } })

    const header = el('div', { attrs: { style: 'display:flex; gap:10px; align-items:center; justify-content:space-between;' } },
      el('h1', { class: 'h1', text: 'Akun' }),
      el('div', { attrs: { style: 'display:flex; gap:8px;' } },
        el('button', { attrs: { type: 'button' }, onclick: () => { tab = 'wallets'; render() } }, 'Dompet'),
        el('button', { attrs: { type: 'button' }, onclick: () => { tab = 'categories'; render() } }, 'Kategori')
      )
    )

    wrap.replaceChildren(header, content)

    async function walletRow(w, { canArchive }) {
      const base = await getActiveBalancesMap()
      const current = base.get(w.id) || 0

      const left = el('div', { attrs: { style: 'display:flex; gap:10px; align-items:center;' } },
        Badge({ icon: w.icon || '💵', color: w.color || '#111111' }),
        el('div', {},
          el('div', { attrs: { style: 'font-weight:800;' }, text: w.name }),
          el('div', { attrs: { style: 'font-size:12px; color:#555;' }, text: `saldo: ${fmt(current)} • status: ${w.status}` })
        )
      )

      const actions = []
      if (canArchive) {
        actions.push(
          el('button', {
            attrs: { type: 'button' },
            onclick: async () => {
              try {
                const input = prompt(
                  `Set saldo real untuk "${w.name}"\nSaldo saat ini: ${fmt(current)}\nMasukkan saldo target (>= 0):`,
                  String(current)
                )
                if (input === null) return

                const res = await reconcileWalletBalance(
                  { walletId: w.id, targetBalance: input },
                  { deviceId }
                )
                alert(res.message)
                await render()
              } catch (err) {
                console.error(err)
                alert(err?.code === 'VALIDATION' ? err.details.join(', ') : 'Gagal reconcile. Cek console.')
              }
            }
          }, 'Set Saldo')
        )

        actions.push(
          el('button', {
            attrs: { type: 'button' },
            onclick: async () => {
              const ok = confirm(`Archive dompet "${w.name}"? (tidak akan muncul di Add)`)
              if (!ok) return
              await archiveWallet(w.id)
              await render()
            }
          }, 'Archive')
        )
      } else {
        actions.push(el('span', { attrs: { style: 'font-size:12px; color:#666;' }, text: 'archived' }))
      }

      return el('div', { class: 'card', attrs: { style: 'padding:10px; display:flex; justify-content:space-between; align-items:center;' } },
        left,
        el('div', { attrs: { style: 'display:flex; gap:8px; align-items:center;' } }, ...actions)
      )
    }

    async function renderWallets() {
      const statusLine = el('p', { class: 'p', text: '' })

      const toggleArchived = el('label', { attrs: { style: 'display:flex; gap:8px; align-items:center; font-size:12px;' } },
        el('input', {
          attrs: { type: 'checkbox' },
          onclick: (e) => { showArchivedWallets = e.target.checked; render() }
        }),
        el('span', { text: 'Tampilkan archived' })
      )
      toggleArchived.querySelector('input').checked = showArchivedWallets

      const nameInput = el('input', { attrs: { placeholder: 'Nama dompet baru…' } })

      // picker icon+color
      let wa = randomWalletAppearance()
      const iconSel = el('select', {})
      fillIconOptions(iconSel, WALLET_ICONS, wa.icon)
      const colorInput = el('input', { attrs: { type: 'color', value: wa.color } })
      const preview = Badge({ icon: iconSel.value, color: colorInput.value })
      const randomBtn = el('button', { attrs: { type: 'button' } }, 'Random')

      function syncPreview() {
        preview.textContent = iconSel.value
        preview.style.background = colorInput.value
      }
      iconSel.onchange = syncPreview
      colorInput.oninput = syncPreview
      randomBtn.onclick = () => {
        wa = randomWalletAppearance()
        fillIconOptions(iconSel, WALLET_ICONS, wa.icon)
        colorInput.value = wa.color
        syncPreview()
      }

      const addBtn = el('button', { attrs: { type: 'button' } }, 'Tambah')
      addBtn.onclick = async () => {
        statusLine.textContent = ''
        try {
          await createWallet({ name: nameInput.value, icon: iconSel.value, color: colorInput.value })
          nameInput.value = ''
          wa = randomWalletAppearance()
          fillIconOptions(iconSel, WALLET_ICONS, wa.icon)
          colorInput.value = wa.color
          syncPreview()
          await render()
        } catch (err) {
          console.error(err)
          statusLine.textContent = err?.code === 'VALIDATION' ? `Validasi: ${err.details.join(', ')}` : 'Gagal tambah dompet.'
        }
      }

      const { items } = await getWallets({ includeArchived: showArchivedWallets })
      const active = items.filter(w => w.status === 'active')
      const archived = items.filter(w => w.status !== 'active')

      const activeRows = await Promise.all(active.map(w => walletRow(w, { canArchive: true })))
      const archivedRows = await Promise.all(archived.map(w => walletRow(w, { canArchive: false })))

      return el('div', {},
        el('p', { class: 'p', text: 'Dompet (soft archive). Reconcile = buat event koreksi (income/expense). No-minus dijaga di usecase.' }),
        toggleArchived,
        el('div', { class: 'card', attrs: { style: 'padding:10px; margin-top:12px;' } },
          el('div', { attrs: { style: 'display:flex; gap:10px; align-items:center; flex-wrap:wrap;' } },
            preview,
            iconSel,
            colorInput,
            randomBtn,
            nameInput,
            addBtn
          ),
          statusLine
        ),
        el('h2', { attrs: { style: 'font-size:14px; margin: 10px 0 0;' }, text: `Active (${active.length})` }),
        ...activeRows,
        showArchivedWallets
          ? el('div', {},
              el('h2', { attrs: { style: 'font-size:14px; margin: 10px 0 0;' }, text: `Archived (${archived.length})` }),
              ...archivedRows
            )
          : ''
      )
    }

    function categoryRow(c, { canArchive }) {
      const title = `${c.name} (${c.type})`
      const left = el('div', { attrs: { style: 'display:flex; gap:10px; align-items:center;' } },
        Badge({ icon: c.icon || (c.type === 'income' ? '💰' : '🛒'), color: c.color || '#111111' }),
        el('div', {},
          el('div', { attrs: { style: 'font-weight:800;' }, text: title }),
          el('div', { attrs: { style: 'font-size:12px; color:#555;' }, text: `status: ${c.status}` })
        )
      )

      const right = canArchive
        ? el('button', {
            attrs: { type: 'button' },
            onclick: async () => {
              const ok = confirm(`Archive kategori "${c.name}"? (tetap muncul di riwayat/laporan)`)
              if (!ok) return
              try {
                await archiveCategory(c.id)
                await render()
              } catch (err) {
                console.error(err)
                alert(err?.code === 'VALIDATION' ? err.details.join(', ') : 'Gagal archive.')
              }
            }
          }, 'Archive')
        : el('span', { attrs: { style: 'font-size:12px; color:#666;' }, text: 'archived/locked' })

      return el('div', { class: 'card', attrs: { style: 'padding:10px; display:flex; justify-content:space-between; align-items:center;' } },
        left,
        right
      )
    }

    async function renderCategories() {
      const statusLine = el('p', { class: 'p', text: '' })

      const toggleArchived = el('label', { attrs: { style: 'display:flex; gap:8px; align-items:center; font-size:12px;' } },
        el('input', {
          attrs: { type: 'checkbox' },
          onclick: (e) => { showArchivedCats = e.target.checked; render() }
        }),
        el('span', { text: 'Tampilkan archived' })
      )
      toggleArchived.querySelector('input').checked = showArchivedCats

      const nameInput = el('input', { attrs: { placeholder: 'Nama kategori baru…' } })
      const typeSel = el('select', {},
        el('option', { attrs: { value: 'expense' }, text: 'expense' }),
        el('option', { attrs: { value: 'income' }, text: 'income' }),
      )

      let ca = randomCategoryAppearance(typeSel.value)
      const iconSel = el('select', {})
      const colorInput = el('input', { attrs: { type: 'color', value: ca.color } })
      const preview = Badge({ icon: ca.icon, color: ca.color })
      const randomBtn = el('button', { attrs: { type: 'button' } }, 'Random')

      function applyIconsForType() {
        const icons = typeSel.value === 'income' ? INCOME_ICONS : EXPENSE_ICONS
        // kalau icon sekarang tidak ada di list baru, random ulang
        if (!icons.includes(iconSel.value)) {
          ca = randomCategoryAppearance(typeSel.value)
          fillIconOptions(iconSel, icons, ca.icon)
          colorInput.value = ca.color
        } else {
          fillIconOptions(iconSel, icons, iconSel.value)
        }
        syncPreview()
      }

      function syncPreview() {
        preview.textContent = iconSel.value
        preview.style.background = colorInput.value
      }

      fillIconOptions(iconSel, EXPENSE_ICONS, ca.icon)
      iconSel.onchange = syncPreview
      colorInput.oninput = syncPreview
      typeSel.onchange = applyIconsForType

      randomBtn.onclick = () => {
        ca = randomCategoryAppearance(typeSel.value)
        const icons = typeSel.value === 'income' ? INCOME_ICONS : EXPENSE_ICONS
        fillIconOptions(iconSel, icons, ca.icon)
        colorInput.value = ca.color
        syncPreview()
      }

      const addBtn = el('button', { attrs: { type: 'button' } }, 'Tambah')
      addBtn.onclick = async () => {
        statusLine.textContent = ''
        try {
          await createCategory({
            name: nameInput.value,
            type: typeSel.value,
            icon: iconSel.value,
            color: colorInput.value,
          })
          nameInput.value = ''
          ca = randomCategoryAppearance(typeSel.value)
          const icons = typeSel.value === 'income' ? INCOME_ICONS : EXPENSE_ICONS
          fillIconOptions(iconSel, icons, ca.icon)
          colorInput.value = ca.color
          syncPreview()
          await render()
        } catch (err) {
          console.error(err)
          statusLine.textContent = err?.code === 'VALIDATION' ? `Validasi: ${err.details.join(', ')}` : 'Gagal tambah kategori.'
        }
      }

      const { items } = await getCategories({ includeArchived: showArchivedCats })
      const active = items.filter(x => x.status === 'active')
      const archived = items.filter(x => x.status !== 'active')

      return el('div', {},
        el('p', { class: 'p', text: 'Kategori (soft archive). Default Lainnya/Biaya lainnya dikunci.' }),
        toggleArchived,
        el('div', { class: 'card', attrs: { style: 'padding:10px; margin-top:12px;' } },
          el('div', { attrs: { style: 'display:flex; gap:10px; align-items:center; flex-wrap:wrap;' } },
            preview,
            typeSel,
            iconSel,
            colorInput,
            randomBtn,
            nameInput,
            addBtn
          ),
          statusLine
        ),
        el('h2', { attrs: { style: 'font-size:14px; margin: 10px 0 0;' }, text: `Active (${active.length})` }),
        ...active.map(c => categoryRow(c, { canArchive: !isLockedCategoryName(c.name) })),
        showArchivedCats
          ? el('div', {},
              el('h2', { attrs: { style: 'font-size:14px; margin: 10px 0 0;' }, text: `Archived (${archived.length})` }),
              ...archived.map(c => categoryRow(c, { canArchive: false }))
            )
          : ''
      )
    }

    async function render() {
      clear(content)
      if (tab === 'wallets') content.append(await renderWallets())
      else content.append(await renderCategories())
    }

    await render()
  })().catch((e) => {
    console.error(e)
    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Akun' }),
      el('p', { class: 'p', text: 'Gagal load. Cek console.' })
    )
  })
}
