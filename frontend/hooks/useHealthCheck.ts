/**
 * CampusOS — useHealthCheck Hook
 *
 * Example TanStack Query hook demonstrating the API client + query pattern.
 * Future domain hooks will follow this exact same structure.
 */
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import type { HealthCheckResponse } from "@/types";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => get<HealthCheckResponse>("/health"),
    refetchInterval: 30_000, // poll every 30s
    retry: 2,
  });
}
