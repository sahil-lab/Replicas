import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/geist/wght.css'
import '@fontsource-variable/geist-mono/wght.css'
import './styles.css'
import Dashboard from './Dashboard.tsx'
import { applyMotion, readStoredMotion } from './motion.ts'
import { applyTheme, readStoredTheme } from './theme.ts'

const root = document.getElementById('root')
if (!root) {
  throw new Error('The dashboard root element is missing.')
}

applyTheme(readStoredTheme())
applyMotion(readStoredMotion())

createRoot(root).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
)
