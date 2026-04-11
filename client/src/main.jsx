import { Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { MainProvider } from './context/MainContext.jsx'

const enableStrictMode = import.meta.env.VITE_ENABLE_STRICT_MODE === 'true'
const RootWrapper = enableStrictMode ? StrictMode : Fragment

createRoot(document.getElementById('root')).render(
  <RootWrapper>
    <AuthProvider>
      <MainProvider>
        <App />
      </MainProvider>
    </AuthProvider>
  </RootWrapper>,
)
