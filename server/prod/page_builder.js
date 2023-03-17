import fs from 'fs'
import path from 'path'
import { rollup } from 'rollup'
import { fileURLToPath } from 'url'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import { importFromString } from 'module-from-string'
import { minify } from 'terser'

const pageCache = {}

const TIME_RAN_MS = Date.now()
const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'))

export const getPage = route => {
  return pageCache[route]
}

export const buildPage = async (route, pagePath) => {
  if (pageCache[route]) {
    return pageCache[route]
  }

  // transpile the server_entry for this page
  const currentPath = path.dirname(fileURLToPath(import.meta.url))

  const serverBundle = await rollup({
    input: path.join(currentPath, 'ssr_server.jsx'),
    plugins: [
      replace({
        preventAssignment: true,
        ___PAGE_PATH___: `../../${pagePath}`,
      }),
      babel({
        babelHelpers: 'bundled',
        presets: [['solid', { generate: 'ssr', hydratable: true }]],
      }),
    ],
    // make any node_module in package.json (and subfolders) external to supress warnings
    external: Object.keys(pkg.dependencies).map(
      dep => new RegExp(`^${dep}.*`, 'g')
    ),
  })

  const { output: serverOutput } = await serverBundle.generate({
    format: 'esm',
  })

  const ssrPage = await importFromString(serverOutput[0].code, {
    useCurrentGlobal: true,
  })

  // build the client side bundle
  const clientBundle = await rollup({
    input: path.join(currentPath, 'ssr_client.jsx'),
    plugins: [
      replace({
        preventAssignment: true,
        ___PAGE_PATH___: `../../${pagePath}`,
      }),
      commonjs(),
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
        presets: [['solid', { generate: 'dom', hydratable: true }]],
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': 'true',
      }),
    ],
  })

  const { output: clientOutput } = await clientBundle.generate({
    format: 'cjs',
  })

  const minified = await minify(clientOutput[0].code)
  const clientBundlePath = `${route}-${TIME_RAN_MS}.js`

  pageCache[route] = {
    ssrRenderPage: (props = {}) => ssrPage.render({ props, clientBundlePath }),
    clientBundlePath,
    clientBundle: minified.code,
  }

  return pageCache[route]
}
