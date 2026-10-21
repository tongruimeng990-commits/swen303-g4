import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './fonts.css'
import './styles.css'
import './editorial.css'
import './clubs/desktop.css'
import './shortlist/shortlist.css'
import './reference-theme.css'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
