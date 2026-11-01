import { useOutletContext } from 'react-router'
import type { Project, RepairSession } from '@/types/repair'
export type RepairContext = { session: RepairSession; project: Project }
export const useRepair = () => useOutletContext<RepairContext>()
