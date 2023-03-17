import { HydrationScript, isServer } from 'solid-js/web'
import { MetaProvider } from '@solidjs/meta'
import Page from '___PAGE_PATH___'

const PageWrapper = props => {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          type="text/css"
          href="globals.css"
          media="screen"
        />
        {isServer && <HydrationScript />}
      </head>
      <body>
        <MetaProvider tags={props.serverTags}>
          <Page {...props.serverProps} />
        </MetaProvider>
        {isServer && (
          <script id="__D" type="application/json">
            {JSON.stringify(props.serverProps)}
          </script>
        )}
        {isServer && (
          <script
            async
            type="text/javascript"
            src={props.clientBundlePath}
          ></script>
        )}
      </body>
    </html>
  )
}

export default PageWrapper
