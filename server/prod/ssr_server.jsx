import { renderToStringAsync } from 'solid-js/web'
import { renderStylesToString } from '@emotion/server'
import { renderTags } from '@solidjs/meta'
import PageWrapper from './page_wrapper.jsx'

export async function render(serverData) {
  const { clientBundlePath, props } = serverData
  const tags = []
  // server-side render for emotion
  const html = renderStylesToString(
    // server-side render for solid-js
    await renderToStringAsync(() => (
      <PageWrapper
        clientBundlePath={clientBundlePath}
        serverProps={props}
        serverTags={tags}
      />
    ))
  )

  // insert the server gen tags
  return `<!DOCTYPE html>${html.replace('<head>', `<head>${renderTags(tags)}`)}`
}
