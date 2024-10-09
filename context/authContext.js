import { checkAuth } from '@/app/actions/auth.actions'
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { isAuthenticated, user } = await checkAuth()
      setIsAuthenticated(isAuthenticated)
      setCurrentUser(user)
    }

    checkAuthStatus()
  }, [])

  const value = {
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    setCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
