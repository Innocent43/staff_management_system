
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { MeResponse } from "@/types/auth";

import {
  uploadProfileImage,
  removeProfileImage,
} from "@/services/users";

export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: (user) => {
      queryClient.setQueryData<MeResponse>(["me"], (current) =>
        current ? { ...current, user } : current,
      );

      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useRemoveProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeProfileImage,
    onSuccess: (user) => {
      queryClient.setQueryData<MeResponse>(["me"], (current) =>
        current ? { ...current, user } : current,
      );

      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
