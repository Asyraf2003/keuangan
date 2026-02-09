import { clear, el } from '../../shared/dom.js'
import { listWallets } from '../../infra/repos/walletRepo.js'
import { listCategories } from '../../infra/repos/categoryRepo.js'
import { createReportFilters } from '../../ui/components/reportFilters.js'
import { getReport } from '../../application/reports/getReport.js'
import { getMonthlyReport } from '../../application/reports/getMonthlyReport.js'

function fmt(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n || 0))
}

function monthRangeMs(ym) {
  // ym: "YYYY-MM"
  const [y, m] = ym.split('-').map(Number)
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0).getTime()
  const end = new Date(y, m, 0, 23, 59, 59, 999).getTime()
  return { startMs: start, endMs: end }
}

export function renderReport(outlet) {
  clear(outlet)

  const wrap = el('div', { class: 'card' },
    el('h1', { class: 'h1', text: 'Laporan' }),
    el('p', { class: 'p', text: 'Loading…' }),
  )
  outlet.append(wrap)

  ;(async () => {
    const [wallets, categories] = await Promise.all([
      listWallets({ includeArchived: true }),
      listCategories({ includeArchived: true }),
    ])

    const walletMap = new Map(wallets.map(w => [w.id, w]))
    const catMap = new Map(categories.map(c => [c.id, c]))

    const filters = createReportFilters({ wallets, categories })
    const statusLine = el('p', { class: 'p no-print', text: '' })
    const out = el('div', { attrs: { style: 'display:grid; gap:12px; margin-top:12px;' } })

    const exportBtn = el('button', {
      class: 'no-print',
      attrs: { type: 'button', style: 'margin-top:10px;' },
      onclick: () => window.print(),
    }, 'Export PDF')

    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Laporan' }),
      el('p', { class: 'p no-print', text: 'Active-only. Default: transfer out/in tidak dihitung, fee tetap dihitung.' }),
      filters.root,
      exportBtn,
      statusLine,
      out
    )

    // state drill-down
    let selectedMonth = null

    async function render(values) {
      statusLine.textContent = 'Menghitung…'
      out.replaceChildren()

      // reset drill ketika ganti mode/range/filter
      selectedMonth = null

      if (values.view === 'monthly') {
        const rep = await getMonthlyReport(values)
        statusLine.textContent = `Jumlah transaksi dihitung: ${rep.count}`

        const monthsCardEl = monthsCard(rep.months, async (ym) => {
          // toggle
          selectedMonth = (selectedMonth === ym) ? null : ym
          await renderMonthlyDetail(values, ym)
        })

        out.append(
          totalsCard(rep.totals),
          monthsCardEl,
          topExpenseCatsCard(rep.topExpenseCategories, catMap),
        )
        return
      }

      const rep = await getReport(values)
      statusLine.textContent = `Jumlah transaksi dihitung: ${rep.count}`

      out.append(
        totalsCard(rep.totals),
        byWalletCard(rep.breakdown.byWallet, walletMap),
        byCategoryCard(rep.breakdown.byCategory, catMap),
      )
    }

    async function renderMonthlyDetail(baseValues, ym) {
      // re-render monthly but with detail appended under month list
      out.replaceChildren()

      const rep = await getMonthlyReport(baseValues)

      const monthsCardEl = monthsCard(rep.months, async (clickedYm) => {
        selectedMonth = (selectedMonth === clickedYm) ? null : clickedYm
        await renderMonthlyDetail(baseValues, clickedYm)
      })

      out.append(
        totalsCard(rep.totals),
        monthsCardEl,
      )

      if (!ym || selectedMonth !== ym) {
        out.append(topExpenseCatsCard(rep.topExpenseCategories, catMap))
        return
      }

      const { startMs, endMs } = monthRangeMs(ym)
      const detail = await getReport({
        ...baseValues,
        startMs,
        endMs,
        view: 'summary', // internal
      })

      out.append(
        detailCardMonth(ym, detail, walletMap, catMap),
        topExpenseCatsCard(rep.topExpenseCategories, catMap),
      )
    }

    filters.onApply(render)
    await render(filters.getValues())
  })().catch((e) => {
    console.error(e)
    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Laporan' }),
      el('p', { class: 'p', text: 'Gagal load. Cek console.' })
    )
  })
}

function totalsCard(totals) {
  return el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
    el('div', { attrs: { style: 'font-weight:800; font-size:14px;' }, text: 'Ringkasan' }),
    el('div', { attrs: { style: 'margin-top:8px; display:grid; gap:6px; font-size:13px;' } },
      row('Income', fmt(totals.income)),
      row('Expense', fmt(totals.expense)),
      row('Net', fmt(totals.net)),
    )
  )
}

function monthsCard(months, onPickMonth) {
  return el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
    el('div', { attrs: { style: 'font-weight:800; font-size:14px;' }, text: 'Bulanan (klik untuk detail)' }),
    months.length === 0
      ? el('p', { class: 'p', text: 'Tidak ada data di range ini.' })
      : el('div', { attrs: { style: 'margin-top:8px; display:grid; gap:8px; font-size:13px;' } },
          ...months.map(m =>
            el('button', {
              attrs: { type: 'button', style: 'text-align:left; padding:8px;' },
              onclick: () => onPickMonth(m.month)
            },
              `${m.month}  |  +${fmt(m.income)} / -${fmt(m.expense)} / net ${fmt(m.net)}  (${m.count})`
            )
          )
        )
  )
}

function detailCardMonth(ym, rep, walletMap, catMap) {
  return el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
    el('div', { attrs: { style: 'font-weight:800; font-size:14px;' }, text: `Detail Bulan ${ym}` }),
    el('div', { attrs: { style: 'margin-top:8px; display:grid; gap:10px;' } },
      totalsCard(rep.totals),
      byWalletCard(rep.breakdown.byWallet, walletMap, 'Per Dompet (bulan ini)'),
      byCategoryCard(rep.breakdown.byCategory, catMap, 'Per Kategori (bulan ini)'),
    )
  )
}

function topExpenseCatsCard(list, catMap) {
  return el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
    el('div', { attrs: { style: 'font-weight:800; font-size:14px;' }, text: 'Top Expense Kategori (Range)' }),
    list.length === 0
      ? el('p', { class: 'p', text: 'Tidak ada expense di range ini.' })
      : el('div', { attrs: { style: 'margin-top:8px; display:grid; gap:6px; font-size:13px;' } },
          ...list.map(x => {
            const name =
              x.category_id === null ? 'Tanpa kategori'
              : (catMap.get(x.category_id)
                  ? `${catMap.get(x.category_id).name} (${catMap.get(x.category_id).type})${catMap.get(x.category_id).status === 'archived' ? ' (archived)' : ''}`
                  : x.category_id
                )
            return row(name, fmt(x.totalExpense))
          })
        )
  )
}

function byWalletCard(byWallet, walletMap, title = 'Per Dompet') {
  return el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
    el('div', { attrs: { style: 'font-weight:800; font-size:14px;' }, text: title }),
    el('div', { attrs: { style: 'margin-top:8px; display:grid; gap:6px; font-size:13px;' } },
      ...byWallet.map(x => {
        const w = walletMap.get(x.wallet_id)
        const name = w ? `${w.name}${w.status === 'archived' ? ' (archived)' : ''}` : x.wallet_id
        return row(name, `+${fmt(x.income)} / -${fmt(x.expense)}`)
      })
    )
  )
}

function byCategoryCard(byCategory, catMap, title = 'Per Kategori') {
  return el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
    el('div', { attrs: { style: 'font-weight:800; font-size:14px;' }, text: title }),
    el('div', { attrs: { style: 'margin-top:8px; display:grid; gap:6px; font-size:13px;' } },
      ...byCategory.map(x => {
        const name =
          x.category_id === null ? 'Tanpa kategori'
          : (catMap.get(x.category_id)
              ? `${catMap.get(x.category_id).name} (${catMap.get(x.category_id).type})${catMap.get(x.category_id).status === 'archived' ? ' (archived)' : ''}`
              : x.category_id
            )
        return row(name, `+${fmt(x.income)} / -${fmt(x.expense)}`)
      })
    )
  )
}

function row(left, right) {
  return el('div', { attrs: { style: 'display:flex; justify-content:space-between; gap:12px;' } },
    el('div', { text: left }),
    el('div', { attrs: { style: 'font-weight:800;' }, text: right })
  )
}
