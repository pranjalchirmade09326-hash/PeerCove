/**
 * Supervisor Module - Central Index
 * Exports all public APIs and types
 */

// Domain Layer - Entities
export { SupervisorProfile, type SupervisorProfileProps } from './domain/entities/SupervisorProfile';
export { SupervisorStats, type SupervisorStatsProps } from './domain/entities/SupervisorStats';

// Domain Layer - Interfaces
export type { ISupervisorService } from './domain/interfaces/ISupervisorService';

// Application Layer - Use Cases
export { GetSupervisorProfileUseCase } from './application/usecases/GetSupervisorProfileUseCase';
export { GetSupervisorStatsUseCase } from './application/usecases/GetSupervisorStatsUseCase';

// Application Layer - DTOs
export type {
  GetSupervisorProfileInput,
  GetSupervisorProfileOutput,
  GetSupervisorStatsInput,
  GetSupervisorStatsOutput,
  GetTeamMembersInput,
  GetTeamMembersOutput,
  SearchSupervisorsInput,
  SearchSupervisorsOutput,
  UpdateSupervisorProfileInput,
  TeamMemberOutput,
  Result,
} from './application/dto/index';

// Infrastructure Layer - Repository
export { SupervisorRepository } from './infrastructure/repositories/SupervisorRepository';

// Infrastructure Layer - Service
export { SupervisorServiceImpl } from './infrastructure/services/SupervisorServiceImpl';

// Presentation Layer - Components
export { SupervisorDashboard } from './presentation/components/SupervisorDashboard';
export { SupervisorProfileHeader } from './presentation/components/SupervisorProfileHeader';
export { SupervisorStatsGrid } from './presentation/components/SupervisorStatsGrid';
export { TeamMembersTable } from './presentation/components/TeamMembersTable';

// Presentation Layer - Hooks
export { useSupervisorProfile } from './presentation/hooks/useSupervisorProfile';
export { useSupervisorStats } from './presentation/hooks/useSupervisorStats';

// Configuration
export { supervisorConfig, getSupervisorConfig, type SupervisorConfig } from './config/supervisor.config';

/**
 * Module Usage Examples
 *
 * 1. Basic Dashboard
 * ─────────────────
 * import { SupervisorDashboard } from '@/modules/client/peercove/supervisor';
 *
 * export default function Page() {
 *   return <SupervisorDashboard supervisorId="sup-001" />;
 * }
 *
 * 2. Custom Hook
 * ──────────────
 * import { useSupervisorProfile } from '@/modules/client/peercove/supervisor';
 *
 * function MyComponent() {
 *   const { data, loading, error } = useSupervisorProfile('sup-001');
 *   return <div>{data?.fullName}</div>;
 * }
 *
 * 3. Direct Service Usage
 * ──────────────────────
 * import { SupervisorServiceImpl } from '@/modules/client/peercove/supervisor';
 *
 * const service = new SupervisorServiceImpl();
 * const profile = await service.getSupervisorProfile('sup-001');
 *
 * 4. With Authentication
 * ──────────────────────
 * import { SupervisorServiceImpl } from '@/modules/client/peercove/supervisor';
 *
 * const service = new SupervisorServiceImpl();
 * service.setAuthToken('jwt-token');
 * const profile = await service.getSupervisorProfile('sup-001');
 */
