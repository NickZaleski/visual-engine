import React from 'react'
import ReactDOM from 'react-dom/client'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from './stripe/config'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </AuthProvider>
  </React.StrictMode>,
)
