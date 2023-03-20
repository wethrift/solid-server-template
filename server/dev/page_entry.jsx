import { render } from 'solid-js/web@~1.6.15'
import { MetaProvider } from '@solidjs/meta'

async function init() {
  const data = JSON.parse(document.getElementById('__D').textContent)
  const Page = (await import(data.pagePath)).default

  render(
    () => (
      <MetaProvider>
        <Page {...data.props} />
      </MetaProvider>
    ),
    document.getElementById('root')
  )
}

init()
