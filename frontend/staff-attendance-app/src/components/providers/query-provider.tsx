"use client"

import { useEffect, useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { useAuthStore } from "@/store/auth-store"

export function QueryProvider({children} : {children: ReactNode}){
    const [queryClient] = useState(()=> new QueryClient({defaultOptions: {queries: {staleTime: 30_000, retry: false}}}))

    const token = useAuthStore((state)=> state.token)

    useEffect(()=>{
        if (!token) queryClient.clear()
    },[token,queryClient])

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}