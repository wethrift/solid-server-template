const registeredModules = {}

export function register(fullURL) {
  const id = new URL(fullURL).pathname
  const existing = registeredModules[id]
  if (existing) {
    existing.locked = true
    existing.disposeCallbacks.map(cb => cb())
    return existing
  }

  console.log('[HMR]: registering', id)
  registeredModules[id] = {
    id,
    data: {},
    locked: false,
    accepted: false,
    acceptCallbacks: [],
    disposeCallbacks: [],
    dispose(cb) {
      this.disposeCallbacks.push(cb)
    },
    invalidate() {
      location.reload()
    },
    accept(cb) {
      if (this.locked) {
        return
      }
      this.accepted = true
      this.acceptCallbacks.push(cb)
    },
  }
  return registeredModules[id]
}

async function updateJS(path, depMap, root) {
  const moduleState = registeredModules[path]
  if (!moduleState) {
    return
  }
  for (const callback of moduleState.acceptCallbacks) {
    if (callback && typeof callback === 'function') {
      const module = await import(path + '?time=' + Date.now())
      callback({ module })
      console.log('[HMR]: updated', path, root ? `-> change in ${root}` : '')
    } else {
      for (const dep of Object.keys(depMap[path] || {})) {
        await updateJS(dep, depMap, root || path)
      }
    }
  }
}

function startHMR() {
  const source = new EventSource('/_hmr_stream')

  source.onopen = () => {
    console.log('[HMR]: connected')
  }

  source.onmessage = async event => {
    const data = JSON.parse(event.data)
    if (data.type === 'update') {
      updateJS(data.url, data.moduleDependents)
    } else if (data.type === 'updateCSS') {
      const links = document.getElementsByTagName('link')
      for (let i = 0; i < links.length; i++) {
        if (links[i].href && links[i].href.split('?')[0].endsWith(data.url)) {
          links[i].href = data.url + '?version=' + Date.now()
          console.log('[HMR]: updated CSS', data.url)
        }
      }
    }
  }

  source.onerror = event => {
    console.log('[HMR]: EventSource error', event)
  }
}

startHMR()
