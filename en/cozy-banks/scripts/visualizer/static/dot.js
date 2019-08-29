function formatDate(d) {
  return d && d.substr(0, 10)
}

function getOpLabel(op) {
  return `${formatDate(op['date'])}
${op['label']}
${op['amount']}`
}

function getBillLabel(bill) {
  return `${formatDate(bill['date'])}
${bill['vendor']}
${bill['beneficiary'] || ''}
${bill['subtype'] || ''}
${bill['amount']} ; O ${bill['originalAmount']} ; G ${bill['groupAmount']}`
}

const maybeQuote = x => {
  if (x.indexOf(' ') > -1 || x.indexOf('\n') > -1) {
    return `"${x}"`
  } else {
    return x
  }
}
const fmtOpts = opts => {
  return Object.keys(opts)
    .map(k => `${k}=${maybeQuote(opts[k])}`)
    .join(' ')
}

class Dot {
  constructor() {
    this.source = []
  }

  node(name, options) {
    this.source.push(`"${name}" [${fmtOpts(options)}]`)
  }

  edge(id1, id2, options) {
    this.source.push(`"${id1}" -> "${id2}" [${fmtOpts(options)}]`)
  }

  toSource() {
    return `digraph {
          rankdir=TB
          ${this.source.join('\n')}
        }`
  }
}

function renderBill(dot, bill) {
  dot.node(bill['_id'], {
    label: getBillLabel(bill),
    color: bill['isRefund'] ? 'green' : 'red'
  })
}

function renderOp(dot, op) {
  dot.node(op['_id'], {
    label: getOpLabel(op),
    color: op.amount < 0 ? 'red' : 'green',
    shape: 'rect'
  })
}

const comparison = selector => (a, b) => {
  return selector(a) > selector(b) ? 1 : -1
}

function outputGraphviz(data) {
  let dot = new Dot()

  const matchings = Object.values(data).sort(comparison(x => x.bill.date))
  for (let matching of matchings) {
    const debit = matching['debitOperation']
    const credit = matching['creditOperation']
    const bill = matching['bill']

    renderBill(dot, bill)
    if (debit) {
      renderOp(dot, debit)
      dot.edge(bill['_id'], debit['_id'], {
        label: 'paid by'
      })
    }
    if (credit) {
      renderOp(dot, credit)
      dot.edge(bill['_id'], credit['_id'], {
        label: 'reimbursed by'
      })
    }
  }
  return `${dot.toSource()}\n}`
}

window.outputGraphviz = outputGraphviz
