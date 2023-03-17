import { buildPage, getPage } from './page_builder.js'
import getServerSideProps from '../common/get_server_side_props.js'

export const pageHandler = async (
  fastify,
  route,
  relativeFilePath,
  filePath,
  isProtectedRoute
) => {
  const pagePath = relativeFilePath.replaceAll('\\', '/')
  console.log(
    `[Router] Creating ${
      isProtectedRoute ? 'protected ' : ''
    }${route} (${pagePath})`
  )

  const { ssrRenderPage, clientBundlePath, clientBundle } = await buildPage(
    route,
    pagePath
  )

  // dont serve protected routes from direct paths
  if (!isProtectedRoute) {
    fastify.get(route, async (request, reply) => {
      reply.type('text/html')
      try {
        const { props, redirect, notFound } = await getServerSideProps(
          filePath,
          request
        )
        if (redirect) {
          reply
            .status(redirect.statusCode || 308)
            .redirect(redirect.destination)
          return
        }
        if (notFound) {
          const page404 = await getPage('/404')
          reply.status(notFound.statusCode || 404)
          return page404.ssrRenderPage()
        }
        return await ssrRenderPage(props)
      } catch (error) {
        console.error(error)
        const page500 = await getPage('/500')
        reply.status(500)
        return page500.ssrRenderPage({ error })
      }
    })
  }

  fastify.get(clientBundlePath, (request, reply) => {
    reply.type('application/javascript')
    return clientBundle
  })
}

export const apiHandler = async (fastify, route, relativeFilePath) => {
  const pagePath = '/' + relativeFilePath.replaceAll('\\', '/')
  console.log(`[Router] Creating API route ${route} (${pagePath})`)
  const apiFunc = (await import(`../../${pagePath}`)).default
  fastify.get(route, async (request, reply) => {
    return apiFunc(request, reply)
  })
}
