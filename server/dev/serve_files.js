import path from 'path'
import { fileURLToPath } from 'url'
import { transformFileAsync } from '@babel/core'
import createImportLister from 'babel-plugin-list-imports'
import solidRefresh from 'solid-refresh/babel'
import { registerModule, getLastUpdated } from './module_graph.js'
import solidPackage from 'solid-js/package.json' assert { type: 'json' }

const CDN_PREFIX = 'https://esm.sh/'
const CDN_DEV_QUERY = '?dev'
const SOLID_VERSION = solidPackage.version

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
            if (source.value.includes('solid-js/web')) {
              source.value = `${CDN_PREFIX}solid-js@${SOLID_VERSION}/web${CDN_DEV_QUERY}`
            } else {
              // the suffix below enforces esm.sh to use the correct solid version for module dependencies (multi version causes hmr issues)
              source.value = `${CDN_PREFIX}${source.value}${CDN_DEV_QUERY}&deps=solid-js@${SOLID_VERSION}`
            }
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
