const acceptCallbacks = {}
const disposeCallbacks = {}

export function register(path) {
  if (!acceptCallbacks[path]) {
    console.log('[HMR]: registering', path)
    acceptCallbacks[path] = true
  }
  return {
    accept(_mod) {
      acceptCallbacks[path] = _mod
    },
    invalidate() {
      location.reload()
    },
    dispose(callback) {
      disposeCallbacks[path] = callback
    },
    data: {},
  }
}

async function updateJS(path, depMap, root) {
  const callback = acceptCallbacks[path]
  if (callback && typeof callback === 'function') {
    const module = await import(path + '?mtime=' + Date.now())
    callback({ module })
    console.log('[HMR]: updated', path, root ? `-> change in ${root}` : '')
  } else {
    for (const dep of Object.keys(depMap[path] || {})) {
      await updateJS(dep, depMap, root || path)
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
