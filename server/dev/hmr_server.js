import fastifySSE from 'fastify-sse'
import chokidar from 'chokidar'
import { moduleDependents, updateModule } from './module_graph.js'

export async function startHMRServer(fastify) {
  await fastify.register(fastifySSE)

  let clients = []

  fastify.get('/_hmr_stream', (request, reply) => {
    reply.sse({ type: 'init' })

    clients.push({ id: request.id, reply })

    request.raw.on('close', () => {
      clients = clients.filter(client => client.id !== request.id)
    })
  })

  chokidar
    .watch(['./components', './routes', './constants', './public/globals.css'])
    .on('change', path => {
      clients.forEach(client => {
        if (path.startsWith('public')) {
          client.reply.sse({
            type: 'updateCSS',
            url: path.substring(7),
          })
        } else {
          const url = `/${path.replaceAll('\\', '/')}`
          updateModule(url)
          client.reply.sse({
            url,
            moduleDependents,
            type: 'update',
          })
        }
      })
    })
}
