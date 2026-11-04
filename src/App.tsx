import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import AppRouter from "./app/router/AppRouter"
import ThemeProvider from "./shared/theme/ThemeProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30 seconds
    },
  },
})
function App() {

  return (
    <ThemeProvider><QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider></ThemeProvider>
  )
}

export default App
