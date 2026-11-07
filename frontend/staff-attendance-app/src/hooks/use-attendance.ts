import { useQuery } from "@tanstack/react-query";

import { getMyStatus, getToday } from "@/services/attendance";

export function useMyStatus(){
    return useQuery({
        queryKey: ["attendance","me","status"],
        queryFn: getMyStatus,
        refetchInterval: 60_000,
    })

}

export function useToday(){
    return useQuery({
        queryKey: ["attendance","today"],
        queryFn: getToday,
        refetchInterval: 30_000,
    })
}


