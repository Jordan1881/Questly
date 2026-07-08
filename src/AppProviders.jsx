import { useEffect } from 'react'
import Toast from './components/Toast'
import LevelUp from './overlays/LevelUp'
import SessionExpired from './overlays/SessionExpired'
import { useLevelUpStore } from './stores/levelUpStore'
import { setApiErrorHandler } from './lib/api'
import { useToastStore } from './stores/toastStore'

function GlobalOverlays() {
  const level = useLevelUpStore((s) => s.level)
  const dismiss = useLevelUpStore((s) => s.dismiss)
  return <LevelUp level={level} onContinue={dismiss} />
}

export default function AppProviders({ children }) {
  useEffect(() => {
    setApiErrorHandler((error) => {
      useToastStore.getState().showError(error.message)
    })
    return () => setApiErrorHandler(null)
  }, [])

  return (
    <>
      {children}
      <Toast />
      <SessionExpired />
      <GlobalOverlays />
    </>
  )
}
