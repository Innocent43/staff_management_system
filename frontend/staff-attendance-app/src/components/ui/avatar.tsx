"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/cn"



type AvatarProps = {
    name: string
    imageUrl?: string | null
    size?: "sm" | "md" | "lg"
    className?: string
}


const SIZE_STYLES = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-16 text-xl",
}


export function Avatar({name,imageUrl,size = "md", className,} : AvatarProps){
    const [imageError,setImageError] = useState(false)

    const initials = name.trim().split(/\s+/).slice(0,2).map((part)=> part[0]?.toUpperCase() ?? "").join("")

    const showImage = Boolean(imageUrl) && !imageError
    return (
        <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-bold text-brand-800", SIZE_STYLES[size], className,)} role="img" aria-label={`${name}'s profile picture`}>
            {showImage ? (<Image src={imageUrl!} alt="" fill sizes="64px" className="object-cover" onError={()=>setImageError(true)} unoptimized/>) : (
                initials || "?"
            )}

        </div>
    )
}