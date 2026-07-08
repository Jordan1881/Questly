import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { registerGsap } from './design-system/motion'
import './index.css'

registerGsap()
import AppProviders from './AppProviders.jsx'
import { router } from './router/index.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
