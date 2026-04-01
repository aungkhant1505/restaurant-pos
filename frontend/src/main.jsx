import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Create the Query Client (The Cache Engine)
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  // 2. Wrap your app to provide the cache engine to all pages
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
