// src/shared/dom.js
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)

  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null) continue

    if (k === 'class') node.className = v
    else if (k === 'text') node.textContent = String(v)
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v)
    } else if (k === 'attrs' && typeof v === 'object') {
      for (const [ak, av] of Object.entries(v)) node.setAttribute(ak, String(av))
    } else {
      node.setAttribute(k, String(v))
    }
  }

  for (const c of children.flat()) {
    if (c === undefined || c === null) continue
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
  }

  return node
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild)
}
