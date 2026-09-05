import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { ClerkProvider } from '@clerk/react'

const Publishable_key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!Publishable_key) {
    throw new Error('Missing Publishable key')
}

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <ClerkProvider publishableKey={Publishable_key}>
            <Provider store={store}>
                <App />
            </Provider>
        </ClerkProvider>
    </BrowserRouter>,
)