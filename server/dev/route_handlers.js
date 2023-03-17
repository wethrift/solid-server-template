import getServerSideProps from '../common/get_server_side_props.js'

export const pageHandler = async (
  fastify,
  route,
  relativeFilePath,
  filePath,
  isProtectedRoute
) => {
  // protected routes get rendered when needed so no dev handler is needed
  if (isProtectedRoute) {
    return
  }

  const pagePath = '/' + relativeFilePath.replaceAll('\\', '/')
  console.log(`[Router] Creating ${route} (${pagePath})`)

  fastify.get(route, async (request, reply) => {
    try {
      const { props, redirect, notFound } = await getServerSideProps(
        filePath,
        request
      )
      if (redirect) {
        reply.status(redirect.statusCode || 308).redirect(redirect.destination)
        return
      }
      if (notFound) {
        reply.type('text/html').status(notFound.statusCode || 404)
        return renderPage({
          props,
          pagePath: '/routes/404.jsx',
        })
      }
      reply.type('text/html')
      return renderPage({
        props,
        pagePath,
      })
    } catch (err) {
      console.error(err)
      reply.type('text/html').status(500)
      return renderPage({
        pagePath: '/routes/500.jsx',
      })
    }
  })
}

function renderPage(pageData) {
  return `
  <html>
    <head>
      <link id="global_stylesheet" rel="stylesheet" type="text/css" href="globals.css?version=#" media="screen"/>
    </head>
    <body>
      <div id="root"/>
        <script id="__D" type="application/json">${JSON.stringify(
          pageData
        )}</script>
        <script type="module" src="/server/dev/hmr_client.js"></script><script type="module" src="/server/dev/page_entry.jsx"></script>
    </body>
  </html>`
}

export const apiHandler = (fastify, route, relativeFilePath) => {
  const pagePath = '/' + relativeFilePath.replaceAll('\\', '/')
  console.log(`[Router] Creating API route ${route} (${pagePath})`)
  fastify.get(route, async (request, reply) => {
    return (await import(`../../${pagePath}`)).default(request, reply)
  })
}
