import loadFastify from 'fastify'
import fastifyCompress from '@fastify/compress'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'
import { serveFilesHandler } from './server/dev/serve_files.js'
import {
  pageHandler as devPageHandler,
  apiHandler as devApiHandler,
} from './server/dev/route_handlers.js'
import {
  pageHandler as prodPageHandler,
  apiHandler as prodApiHandler,
} from './server/prod/route_handlers.js'
import { startHMRServer } from './server/dev/hmr_server.js'
import filesToRoutes from './server/utils/files_to_routes.js'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const protectedRoutes = ['/404', '/500']

const start = async () => {
  try {
    const currentPath = path.dirname(fileURLToPath(import.meta.url))

    const fastify = loadFastify({
      logger: IS_PRODUCTION
        ? true
        : {
            transport: { target: 'pino-pretty' },
          },
    })
    await fastify.register(fastifyCompress)
    await fastify.register(fastifyStatic, {
      root: path.join(currentPath, 'public'),
      wildcard: false,
    })

    let pageHandler = prodPageHandler
    let apiHandler = prodApiHandler

    if (!IS_PRODUCTION) {
      await startHMRServer(fastify)
      pageHandler = devPageHandler
      apiHandler = devApiHandler
    }

    const routes = await filesToRoutes('./routes')
    for (const { route, filePath } of routes) {
      if (route.startsWith('/api')) {
        await apiHandler(
          fastify,
          route,
          path.relative(currentPath, filePath),
          filePath
        )
      } else if (!route.endsWith('.data')) {
        await pageHandler(
          fastify,
          route,
          path.relative(currentPath, filePath),
          filePath,
          protectedRoutes.includes(route)
        )
      }
    }

    if (!IS_PRODUCTION) {
      // local js server (ensure compression is disabled due to fastify bug)
      await fastify.get('*', { compress: false }, serveFilesHandler)
    }

    const port = process.env.PORT || 3000
    console.log(`Listening on port ${port}`)
    await fastify.listen({
      port,
      host: process.env.HOST || '0.0.0.0',
    })
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

start()
