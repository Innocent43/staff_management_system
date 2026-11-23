import { api } from "@/lib/api";
import type { User } from "@/types/auth";

export function uploadProfileImage(file:File) {
    const formData = new FormData()

    formData.append("file", file)

    return api<User>("/users/me/profile-image", {method: "PUT", body: formData,})
    
}



export function removeProfileImage(){
    return api<User>("/users/me/profile-image", {
        method: "DELETE",
    })
}