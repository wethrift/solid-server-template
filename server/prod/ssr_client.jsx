import { hydrate } from 'solid-js/web'
import PageWrapper from './page_wrapper.jsx'

const serverData = JSON.parse(document.getElementById('__D').textContent)
hydrate(() => <PageWrapper serverProps={serverData} />, document)
