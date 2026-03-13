import { Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/ThemeProvider"
import ProtectedRoute from "@/components/ProtectedRoute"
import LoginPage from "@/pages/LoginPage"
import MainApp from "@/components/MainApp"

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  )
}
