# Admin Module Architecture

## Overview

The Admin Module is a comprehensive, enterprise-grade dashboard system designed for platform administrators, moderators, and analysts. It provides real-time insights into platform health, user management capabilities, and system monitoring with a clean, layered architecture following Domain-Driven Design (DDD) principles.

**Key Statistics:**
- 18 TypeScript files (3 domain + 3 application + 2 infrastructure + 6 presentation + 1 config + 1 tests + 2 docs)
- Full type safety with comprehensive error handling
- Production-ready code with 20+ test cases
- Responsive UI with loading states and error boundaries
- JWT authentication with retry logic and 30-second timeouts

---

## Architecture Layers

### 1. Domain Layer (Pure Business Logic)

The domain layer contains the core business entities and their validation rules. It is completely framework-independent and can be tested in isolation.

#### Files:
- **`domain/entities/AdminProfile.ts`** - Admin user entity with immutable state
- **`domain/entities/AdminStats.ts`** - Statistics and metrics calculations
- **`domain/interfaces/IAdminService.ts`** - Service contract definition

#### Entities:

**AdminProfile**
```typescript
class AdminProfile {
  // Core properties
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  role: 'super-admin' | 'moderator' | 'analyst'
  permissions: string[]
  departmentId: string
  accessLevel: 1 | 2 | 3 | 4 | 5
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  // Business logic methods
  hasPermission(permission: string): boolean
  canViewReports(): boolean
  canManageUsers(): boolean
  canAccessResource(resourceLevel: number): boolean
  isHighPrivilege(): boolean
  getDepartment(): string
  getInitials(): string
  getRoleDisplayName(): string
}
```

**Validation Rules:**
- ID and email are required and validated
- Email must match RFC 5322 pattern
- Role must be one of: super-admin, moderator, analyst
- Access level must be 1-5
- At least one permission required
- Department ID is required

**AdminStats**
```typescript
class AdminStats {
  // Core properties
  adminId: string
  totalUsers: number
  totalListeners: number
  totalReports: number
  totalSessions: number
  activeModeration: number
  reportsPending: number
  avgResponseTime: number
  createdAt: Date
  updatedAt: Date

  // Calculated metrics
  workloadScore(): number
  efficiencyRating(): number
  teamHealth(): 'healthy' | 'warning' | 'critical'
  getSessionsPerListener(): number
  getReportResolutionRate(): number
  getModerationProgress(): number
  getSystemStatus(): 'optimal' | 'nominal' | 'degraded'
}
```

**Calculation Logic:**
- **Workload Score**: Based on pending reports and active moderation tasks
- **Efficiency Rating**: Resolution rate (0-100%) and response time efficiency
- **Team Health**: Determined by efficiency and pending report ratio
- **System Status**: Composite score from efficiency, response time, and team health

#### IAdminService Interface

```typescript
interface IAdminService {
  // Profile operations
  getAdminProfile(adminId: string): Promise<AdminProfile>
  updateAdminProfile(adminId: string, updates: Partial<AdminProfile>): Promise<AdminProfile>
  searchAdmins(query: string, limit?: number): Promise<AdminProfile[]>

  // Stats operations
  getAdminStats(adminId: string): Promise<AdminStats>
  updateAdminStats(adminId: string, stats: Partial<AdminStats>): Promise<AdminStats>

  // Permission checks
  checkPermission(adminId: string, permission: string): Promise<boolean>
  validateAccess(adminId: string, resourceLevel: number): Promise<boolean>

  // Department operations
  getAdminsByDepartment(departmentId: string): Promise<AdminProfile[]>
  getDepartmentStats(departmentId: string): Promise<AdminStats>
}
```

---

### 2. Application Layer (Use Cases & DTOs)

The application layer implements use cases that orchestrate domain entities and coordinate with infrastructure.

#### Files:
- **`application/usecases/GetAdminProfileUseCase.ts`** - Fetch and map profile data
- **`application/usecases/GetAdminStatsUseCase.ts`** - Fetch and calculate stats
- **`application/dto/index.ts`** - Data transfer object contracts

#### Use Cases:

**GetAdminProfileUseCase**
```typescript
class GetAdminProfileUseCase {
  async execute(input: GetAdminProfileInput): Promise<Result<GetAdminProfileOutput>>

  // Responsibilities:
  // 1. Input validation (adminId required and non-empty)
  // 2. Service orchestration
  // 3. Error handling and transformation
  // 4. Performance metrics (duration tracking)
}
```

**GetAdminStatsUseCase**
```typescript
class GetAdminStatsUseCase {
  async execute(input: GetAdminStatsInput): Promise<Result<GetAdminStatsOutput>>

  // Responsibilities:
  // 1. Input validation
  // 2. Stats calculation through domain methods
  // 3. Metric aggregation and transformation
  // 4. Response mapping to DTO
}
```

#### DTOs (Data Transfer Objects)

**Input DTOs:**
```typescript
interface GetAdminProfileInput {
  adminId: string
}

interface GetAdminStatsInput {
  adminId: string
}

interface SearchAdminInput {
  query?: string
  role?: 'super-admin' | 'moderator' | 'analyst'
  departmentId?: string
  limit?: number
  offset?: number
}

interface UpdateAdminProfileInput {
  adminId: string
  firstName?: string
  lastName?: string
  email?: string
  permissions?: string[]
  accessLevel?: 1 | 2 | 3 | 4 | 5
}
```

**Output DTOs:**
```typescript
interface GetAdminProfileOutput {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  role: 'super-admin' | 'moderator' | 'analyst'
  permissions: string[]
  departmentId: string
  accessLevel: 1 | 2 | 3 | 4 | 5
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface GetAdminStatsOutput {
  adminId: string
  totalUsers: number
  totalListeners: number
  totalReports: number
  totalSessions: number
  activeModeration: number
  reportsPending: number
  avgResponseTime: number
  workloadScore: number
  efficiencyRating: number
  teamHealth: 'healthy' | 'warning' | 'critical'
  sessionPerListener: number
  reportResolutionRate: number
  moderationProgress: number
  systemStatus: 'optimal' | 'nominal' | 'degraded'
}

interface Result<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    timestamp: string
    duration: number
  }
}
```

---

### 3. Infrastructure Layer (API Communication)

The infrastructure layer handles all external communication, API calls, error handling, and retry logic.

#### Files:
- **`infrastructure/repositories/AdminRepository.ts`** - API client and data mapping
- **`infrastructure/services/AdminServiceImpl.ts`** - Service implementation

#### AdminRepository

**Features:**
- API endpoint management with configurable base URL
- JWT authentication with Bearer token support
- Automatic retry logic (3 attempts with exponential backoff)
- 30-second timeout on all requests
- Response status code handling:
  - 401: Unauthorized (no retry)
  - 403: Forbidden
  - 404: Not found
  - Other errors: Retry with backoff

**Endpoints:**
```
GET    /api/v1/admins/{adminId}
PATCH  /api/v1/admins/{adminId}
GET    /api/v1/admins/{adminId}/stats
GET    /api/v1/admins/search
GET    /api/v1/admins/{adminId}/permissions/{permission}
GET    /api/v1/admins/department/{departmentId}
GET    /api/v1/departments/{departmentId}/stats
```

**Retry Strategy:**
```
Attempt 1: Immediate
Attempt 2: Wait 1s + timeout
Attempt 3: Wait 2s + timeout

No retry for 401 (Unauthorized) - token likely invalid
```

#### AdminServiceImpl

Implements the IAdminService interface with:
- Repository delegation
- Input validation
- Error transformation and logging
- Partial update handling
- Department and permission queries

---

### 4. Presentation Layer (UI Components)

The presentation layer contains React components with hooks for state management and data fetching.

#### Files:
- **`presentation/components/AdminDashboard.tsx`** - Main orchestrator component
- **`presentation/components/AdminProfileHeader.tsx`** - Profile display card
- **`presentation/components/AdminStatsGrid.tsx`** - 8-card stats grid with metrics
- **`presentation/components/DataTable.tsx`** - Reusable paginated data table
- **`presentation/hooks/useAdminProfile.ts`** - Profile fetching hook
- **`presentation/hooks/useAdminStats.ts`** - Stats fetching with auto-refresh

#### Components:

**AdminDashboard** (Orchestrator Component)
```typescript
interface AdminDashboardProps {
  adminId: string
  refreshInterval?: number  // Default: 30000ms
}

// Features:
// - Dual hook management (profile + stats)
// - Concurrent data fetching for performance
// - Manual refresh button with loading state
// - Error boundaries and error display
// - Last refresh time tracking
// - Responsive layout with Tailwind CSS
```

**AdminProfileHeader** (Profile Card)
```typescript
interface AdminProfileHeaderProps {
  profile: AdminProfile
}

// Displays:
// - Avatar with initials
// - Full name and role badge
// - Email and department
// - Access level and active status
// - Permissions list
// - Capabilities (can manage users, view reports, etc)
```

**AdminStatsGrid** (8-Card Stats Grid)
```typescript
interface AdminStatsGridProps {
  stats: AdminStats
  loading?: boolean
}

// Stat Cards:
// 1. Total Users (primary, 👥)
// 2. Total Listeners (primary, 🎧)
// 3. Total Reports (info, 📋)
// 4. Total Sessions (info, 📅)
// 5. Active Moderation (warning, 🔍)
// 6. Pending Reports (warning/error, ⏳)
// 7. Avg Response Time (color-coded, ⏱️)
// 8. Team Health (color-coded, ❤️)

// Additional Metrics Section:
// - Workload Score (color-coded)
// - Efficiency Rating (with %)
// - Report Resolution Rate
// - System Status
```

**DataTable** (Reusable Component)
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number              // Default: 10
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  testId?: string
}

// Features:
// - Sortable columns (click header)
// - Filterable columns (input in header)
// - Full-text search across all columns
// - Pagination with page controls
// - Responsive table layout
// - Loading skeleton states
// - Empty state handling
// - Accessibility: ARIA labels, keyboard navigation
```

#### Custom Hooks:

**useAdminProfile**
```typescript
function useAdminProfile(adminId: string): {
  profile: AdminProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Features:
// - Memoized service instances
// - Single fetch on mount
// - Error state management
// - Manual refetch capability
// - Concurrent use case execution
```

**useAdminStats**
```typescript
function useAdminStats(adminId: string, autoRefreshInterval?: number): {
  stats: AdminStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isAutoRefreshing: boolean
}

// Features:
// - Initial data fetch on mount
// - Auto-refresh at configurable interval (default: 30s)
// - Memoized service instances
// - Error state management
// - Manual refetch capability
// - Cleanup on unmount
```

---

### 5. Configuration Layer

#### File: `config/admin.config.ts`

```typescript
// API Configuration
ADMIN_API_CONFIG: {
  baseUrl: string
  endpoints: Record<string, string>
  timeout: 30000
  retries: 3
  retryDelay: 1000
}

// Cache Configuration
ADMIN_CACHE_CONFIG: {
  profileTTL: 300000      // 5 minutes
  statsTTL: 60000         // 1 minute
  searchTTL: 180000       // 3 minutes
  autoRefreshInterval: 30000  // 30 seconds
}

// Role-Based Permissions
ROLE_PERMISSIONS_MAP: {
  'super-admin': [
    'view-all-reports',
    'view-reports',
    'manage-users',
    'manage-admins',
    'manage-listeners',
    'configure-settings',
    'view-system-stats',
    'export-data',
    'manage-permissions'
  ]
  'moderator': [...]
  'analyst': [...]
}

// Access Levels
ACCESS_LEVEL_CONFIG: {
  1: 'Read Only'
  2: 'Limited Write'
  3: 'Standard Access'
  4: 'Extended Access'
  5: 'Full Access'
}

// Feature Flags
ADMIN_FEATURE_FLAGS: {
  enableAutoRefresh: boolean
  enableAdvancedFiltering: boolean
  enableExport: boolean
  enableBatchOperations: boolean
  enableRealTimeStats: boolean
}

// System Thresholds
ADMIN_THRESHOLDS: {
  warningPendingReports: 20
  criticalPendingReports: 50
  warningResponseTime: 300
  criticalResponseTime: 900
  warningEfficiency: 60
  criticalEfficiency: 40
}

// Department Configuration
DEPARTMENT_CONFIG: Record<string, {
  name: string
  color: string
  icon: string
}>

// Helper Functions
getPermissionsForRole(role: string): string[]
getAccessLevelName(level: number): string
getDepartmentConfig(departmentId: string): DepartmentConfig
isProductionEnvironment(): boolean
getApiBaseUrl(): string
getRefreshInterval(): number
isFeatureEnabled(feature: string): boolean
```

---

## Data Flow

### Profile Fetch Flow
```
User -> AdminDashboard
  ↓
useAdminProfile Hook
  ↓
GetAdminProfileUseCase
  ↓
AdminServiceImpl
  ↓
AdminRepository (API Call)
  ↓
GET /api/v1/admins/{adminId}
  ↓
AdminProfile Entity (Domain)
  ↓
AdminProfileHeader Component (Display)
```

### Stats Fetch & Calculation Flow
```
User -> AdminDashboard (30s interval)
  ↓
useAdminStats Hook (Auto-refresh)
  ↓
GetAdminStatsUseCase
  ↓
AdminServiceImpl
  ↓
AdminRepository (API Call)
  ↓
GET /api/v1/admins/{adminId}/stats
  ↓
AdminStats Entity (Calculations)
  ├─ workloadScore()
  ├─ efficiencyRating()
  ├─ teamHealth()
  ├─ getSystemStatus()
  └─ ...metrics
  ↓
AdminStatsGrid Component (Display)
```

---

## Error Handling Strategy

### Three-Level Error Handling

**Level 1: Domain Layer**
- Entity validation throws errors immediately
- Invalid data never enters the domain
- Clear, domain-specific error messages

**Level 2: Application Layer**
- Use case catches errors and transforms them
- Logs errors for debugging
- Returns structured Result with error details
- Includes performance metrics

**Level 3: Presentation Layer**
- Hooks catch errors and update state
- Components display user-friendly error messages
- Error boundaries prevent cascading failures
- Retry buttons for user recovery

### Error Recovery Flow
```
API Error (401/403/404)
  ↓
Repository detects and handles
  ↓
Service catches and logs
  ↓
UseCase transforms error
  ↓
Hook updates error state
  ↓
Component displays message
  ↓
User can retry or navigate
```

---

## Performance Optimization

### 1. Concurrent Data Fetching
```typescript
// Dashboard fetches profile & stats simultaneously
await Promise.all([
  profileState.refetch(),
  statsState.refetch()
])
```

### 2. Memoization
- Service instances memoized in hooks
- Use cases memoized with useCallback
- Data transformed only when source changes

### 3. Auto-Refresh Strategy
- Profile: 5-minute TTL (300s)
- Stats: 1-minute TTL (60s)
- Auto-refresh interval: 30s
- Users can manually refresh anytime

### 4. Loading States
- Skeleton loaders during fetch
- Cached data shown while refreshing
- Optimistic updates where applicable

---

## Testing Strategy

### Test Coverage (20+ Tests)

**Domain Tests (10 tests)**
- Profile entity validation (5 tests)
- Stats calculation methods (5 tests)

**Application Tests (6 tests)**
- Use case input validation (2 tests)
- Use case execution (2 tests)
- Metadata inclusion (1 test)
- Metric calculations (1 test)

**Infrastructure Tests (4 tests)**
- Repository methods (2 tests)
- Service implementation (2 tests)

**Integration Tests (2+ tests)**
- Complete workflow: UseCase → Service → Repository
- Error propagation through layers

### Testing Approach
- Unit tests for isolated components
- Integration tests for layer interactions
- Mock dependencies (repository, service)
- Performance timing assertions
- Error scenario coverage

---

## Security Considerations

### 1. Authentication
- JWT tokens in Authorization header
- Token format: `Authorization: Bearer {token}`
- Invalid tokens trigger no-retry 401 response

### 2. Authorization
- Role-based access control (RBAC)
- Permission-based feature access
- Access level validation for resources
- Department-scoped operations

### 3. Data Validation
- Client-side input validation
- Server-side validation (API responsibility)
- Email format validation (RFC 5322)
- Type safety with TypeScript

### 4. API Security
- HTTPS only in production
- 30-second timeout on all requests
- Retry backoff prevents DOS scenarios
- Error messages don't leak sensitive data

---

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Feature Flags
NEXT_PUBLIC_ADMIN_AUTO_REFRESH=true
NEXT_PUBLIC_ADMIN_ADVANCED_FILTERS=true
NEXT_PUBLIC_ADMIN_EXPORT=true
NEXT_PUBLIC_ADMIN_BATCH_OPS=true
NEXT_PUBLIC_ADMIN_REALTIME=true

# Runtime
NODE_ENV=development|production
```

---

## Monitoring & Logging

### What's Logged
1. Use case execution start/end
2. Service method calls and results
3. Repository API calls and responses
4. Error messages and stack traces
5. Performance metrics (duration)

### Log Format
```typescript
{
  timestamp: ISO8601
  level: 'error' | 'warn' | 'info' | 'debug'
  layer: 'domain' | 'application' | 'infrastructure' | 'presentation'
  method: string
  duration: number
  error?: string
  data?: any
}
```

---

## API Contract Versioning

Current Version: **v1**

API Endpoints follow REST conventions:
```
GET    /api/v1/admins/{adminId}              → AdminProfile
PATCH  /api/v1/admins/{adminId}              → AdminProfile
GET    /api/v1/admins/{adminId}/stats        → AdminStats
GET    /api/v1/admins/search                 → AdminProfile[]
GET    /api/v1/admins/{adminId}/permissions/{permission} → boolean
GET    /api/v1/admins/department/{departmentId} → AdminProfile[]
GET    /api/v1/departments/{departmentId}/stats → AdminStats
```

---

## Future Enhancements

1. **WebSocket Support** - Real-time stats updates instead of polling
2. **Advanced Analytics** - Historical trends and forecasting
3. **Batch Operations** - Bulk admin management
4. **Audit Logging** - Complete action history
5. **Custom Reports** - User-defined analytics
6. **Alerts & Notifications** - Threshold-based notifications
7. **Multi-language Support** - i18n integration
8. **Dark Mode** - Theme switching
9. **Mobile Responsive** - Complete mobile optimization
10. **Performance Monitoring** - APM integration

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API base URL matches backend deployment
- [ ] JWT token storage secured (HTTPOnly cookies)
- [ ] Error logging integrated
- [ ] Performance monitoring enabled
- [ ] Feature flags configured
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Error scenarios tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

---

## Troubleshooting

### Common Issues

**Profile not loading**
- Check API base URL in config
- Verify JWT token is valid
- Check admin ID format
- Review browser console for errors

**Stats showing stale data**
- Verify auto-refresh interval
- Check stats TTL configuration
- Manual refresh with button
- Verify API stats endpoint

**Permission denied errors**
- Verify user role has permission
- Check access level for resource
- Verify department assignment
- Review permission configuration

**Timeout errors**
- Increase timeout in config
- Check network connectivity
- Verify API endpoint availability
- Review browser network tab

---

## References

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [REST API Design](https://restfulapi.net/)

---

**Last Updated**: November 11, 2026
**Version**: 1.0.0
**Author**: Admin Module Development Team
