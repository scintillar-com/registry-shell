import { registry } from "@shell/registry.config"
import type { ComponentMeta } from "./registry-adapter"

export type { ComponentMeta }

export function getAllComponents(): ComponentMeta[] {
  return registry?.getAllComponents() ?? []
}
