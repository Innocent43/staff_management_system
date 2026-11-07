import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

export function useMe(){
    const router = useRouter()
    const token = useAuthStore((state)=> state.token)
    const ready = useAuthStore((state)=> state.ready)

    const query = useQuery({
        queryKey: ["me"],
        queryFn: getMe,
        enabled: ready && token !== null,
        staleTime: 5 * 60 * 1000
    })
useEffect(()=> {
    if (ready && token === null)router.replace("/login")
},[ready,token,router])

return query
}

