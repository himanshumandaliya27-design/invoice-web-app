'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await signIn('credentials', {
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid password. Try again.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = (provider: string) => {
    signIn(provider, { callbackUrl: '/' })
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-surface-container-low p-4 m-0">
      <div className="w-full max-w-md min-w-[320px] bg-surface p-xl rounded-2xl shadow-sm border border-outline-variant flex flex-col items-center">
        <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mb-md">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>
        
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-black mb-2" style={{ fontFamily: 'Aclonica' }}>
          FinTrust
        </h1>
        <p className="text-on-surface-variant font-body-md text-body-md text-center mb-xl">
          Sign in to access your invoice dashboard.
        </p>

        {error && (
          <div className="w-full p-3 mb-6 bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-md">
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant">Admin Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-md py-sm border border-outline-variant rounded-lg bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
              placeholder="Enter password (default: admin123)"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="w-full flex items-center gap-3 my-xl">
          <div className="flex-1 h-px bg-outline-variant"></div>
          <span className="font-label-md text-label-md text-on-surface-variant">OR</span>
          <div className="flex-1 h-px bg-outline-variant"></div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-sm bg-surface-container-lowest border border-outline-variant text-on-surface py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <button 
            onClick={() => handleOAuthLogin('github')}
            className="w-full flex items-center justify-center gap-sm bg-surface-container-lowest border border-outline-variant text-on-surface py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
          >
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-5 h-5" />
            Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  )
}
