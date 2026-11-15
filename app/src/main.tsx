// SI-assisted (Claude), NASA Space Apps 2026
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled with the site: no request goes to a font host.
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/hanken-grotesk/wght.css'
// Inter is in the stack for Cyrillic lake names only; its files are fetched only when such a name is on screen.
import '@fontsource-variable/inter/index.css'
// Long granule ids in the tables of looks.
import '@fontsource-variable/jetbrains-mono/index.css'
import './styles/tokens.css'
import './styles/ui.css'
import './styles/dash.css'
import './styles/passport.css'
import './styles/landing.css'
import './styles/pages.css'
import './styles/lake.css'
import './styles/misc.css'
import './styles/reading.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
