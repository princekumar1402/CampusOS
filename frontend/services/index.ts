/**
 * CampusOS — API Services Index
 *
 * Service modules that wrap API calls for specific domains.
 * Each service uses the apiClient from lib/api-client.ts.
 *
 * Future services will be added here as modules are implemented:
 *   export * from './auth.service'
 *   export * from './students.service'
 *   export * from './courses.service'
 */

export { get, post, put, patch, del, apiClient } from "@/lib/api-client";
