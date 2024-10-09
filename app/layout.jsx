import '@/app/assets/styles/globals.css'
import AuthWrapper from '@/app/components/AuthWrapper'
import Footer from '@/app/components/Footer'
import Header from '@/app/components/Header'
import { Inter } from 'next/font/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Bookit App | Book a Room',
  description: 'Book a meeting or conference room for your team.',
}

export default function RootLayout({ children }) {
  return (
    <AuthWrapper>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
          <ToastContainer position="bottom-right" />
        </body>
      </html>
    </AuthWrapper>
  )
}
