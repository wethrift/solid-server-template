import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { transformFileAsync } from '@babel/core'
import createImportLister from 'babel-plugin-list-imports'
import solidRefresh from 'solid-refresh/babel'
import { registerModule, getLastUpdated } from './module_graph.js'

const CDN_PREFIX = 'https://esm.sh/'
const CDN_DEV_QUERY = '?dev'
const SOLID_VERSION = JSON.parse(fs.readFileSync('package.json')).dependencies[
  'solid-js'
]

const isRelativeImport = importPath => {
  return importPath.startsWith('.') || importPath.startsWith('/')
}

const BASE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

const ModuleImportTransform = () => {
  return {
    visitor: {
      ImportDeclaration(_path, state) {
        const { source } = _path.node
        if (isRelativeImport(source.value)) {
          const absPath = path.relative(
            BASE_PATH,
            path.join(path.dirname(state.file.opts.filename), source.value)
          )
          const lastUpdated = getLastUpdated(
            `/${absPath.replaceAll('\\', '/')}`
          )
          if (lastUpdated) {
            source.value = `${source.value}?time=${lastUpdated}`
          }
        } else {
          if (!source.value.startsWith(CDN_PREFIX)) {
            // the suffix below is a hack to enforce a single solid-js version due to an esm.sh dependency bug (to allow hmr to work)
            source.value = `${CDN_PREFIX}${source.value}${CDN_DEV_QUERY}&deps=solid-js@${SOLID_VERSION}`
          }
        }
      },
    },
  }
}

const hmrPrefix = () =>
  `import * as __HMR__ from '/server/dev/hmr_client.js'\nimport.meta.hot = __HMR__.register(import.meta.url);`

// this handler transpiles and serves single js filesystem files
// including any related node_modules etc.
export const serveFilesHandler = async (request, reply) => {
  const cleanPath = request.params['*'].split('?')[0]
  const filePath = path.join(BASE_PATH, cleanPath)

  const importListener = createImportLister()
  importListener.once('list', () => {
    registerModule(
      cleanPath,
      Array.from(importListener.state)
        .filter(isRelativeImport)
        .map(importPath =>
          path.join(path.dirname(cleanPath), importPath).replaceAll('\\', '/')
        )
    )
  })

  const { code } = await transformFileAsync(filePath, {
    presets: ['solid'],
    plugins: [
      importListener.plugin,
      [solidRefresh, { bundler: 'esm' }],
      ModuleImportTransform,
    ],
  })

  let result = code
  if (!cleanPath.startsWith('/server')) {
    result = hmrPrefix() + code
  }
  reply.type('application/javascript').send(result)
}
