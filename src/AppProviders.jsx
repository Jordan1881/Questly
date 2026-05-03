import { createContext, useContext, useState } from 'react'

// Temporary context for purchased coupons and pending reward requests.
// These will migrate to a dedicated purchaseStore in M6 when connected to the API.
const ShopContext = createContext(null)

export function useShopContext() {
  return useContext(ShopContext)
}

export default function AppProviders({ children }) {
  const [purchased, setPurchased] = useState(new Set([3]))
  const [pendingRequests, setPendingRequests] = useState(new Set())

  return (
    <ShopContext.Provider value={{ purchased, setPurchased, pendingRequests, setPendingRequests }}>
      {children}
    </ShopContext.Provider>
  )
}
