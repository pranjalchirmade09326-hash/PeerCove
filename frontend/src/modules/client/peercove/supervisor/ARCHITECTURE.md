# Supervisor Module Architecture

## Overview

The Supervisor Module implements a complete 4-layer clean architecture pattern for managing supervisor profiles, team statistics, and team member management within the PeerCove platform. This module handles all supervisor-related operations including profile management, performance tracking, team coordination, and health metrics.

**Module Location:** `D:\PeerCove\frontend\src\modules\client\peercove\supervisor`

## Architecture Layers

### 1. Domain Layer (Framework-Independent)

**Purpose:** Contains core business logic and domain entities that are completely independent of any framework, database, or external dependencies.

**Files:**
- `domain/entities/SupervisorProfile.ts` - Core supervisor entity with validation and business logic
- `domain/entities/SupervisorStats.ts` - Statistics entity with computed properties
- `domain/interfaces/ISupervisorService.ts` - Service contract interface

#### SupervisorProfile Entity

```typescript
// Encapsulates supervisor information with immutable getters
- id: string
- userId: string
- firstName: string
- lastName: string
- email: string
- phone?: string
- teamSize: number
- performanceRating: number (0-5)
- department: string
- experienceLevel: 'junior' | 'mid' | 'senior' | 'lead'
- isActive: boolean
- createdAt: Date
- updatedAt: Date

// Business methods
- fullName: string
- isHighPerformer(): boolean
- isExperienced(): boolean
- hasLargeTeam(): boolean
- getRatingLabel(): string
- getExperienceLevelLabel(): string
- getInitials(): string
```

**Validation Rules:**
- ID, UserID must be non-empty strings
- Name fields must be non-empty
- Email must match valid email regex pattern
- Team size >= 0
- Performance rating between 0-5
- Experience level must be one of allowed values
- Department must be non-empty

#### SupervisorStats Entity

```typescript
// Encapsulates supervisor performance metrics
- supervisorId: string
- teamMembers: number
- activeSessions: number
- avgQualityScore: number (0-100)
- totalWorkload: number
- teamProductivity: number (0-100)
- createdAt: Date
- updatedAt: Date

// Computed properties & business logic
- getHealthScore(): number (weighted calculation)
- getQualityStatus(): 'excellent' | 'good' | 'fair' | 'poor'
- getProductivityStatus(): 'high' | 'normal' | 'low'
- getWorkloadLevel(): 'low' | 'moderate' | 'high' | 'critical'
- getSessionUtilization(): number
- getAverageWorkloadPerMember(): number
- getNeedsAttention(): boolean
```

**Health Score Calculation:**
- Quality Score (40% weight)
- Productivity Score (40% weight)
- Workload Score (20% weight)

### 2. Application Layer

**Purpose:** Orchestrates use cases, handles input validation, and coordinates between domain and infrastructure layers. Implements the application-specific business rules.

**Files:**
- `application/usecases/GetSupervisorProfileUseCase.ts` - Fetches and returns supervisor profile
- `application/usecases/GetSupervisorStatsUseCase.ts` - Fetches and calculates supervisor statistics
- `application/dto/index.ts` - Data Transfer Objects for API contracts

#### Use Cases

**GetSupervisorProfileUseCase**
```typescript
Input:
- supervisorId: string

Output:
- success: boolean
- data?: GetSupervisorProfileOutput
- error?: string
- metadata?: { timestamp: string; duration: number }

Responsibilities:
- Validate input
- Call service layer
- Map domain entity to DTO
- Track performance metrics
- Handle errors gracefully
```

**GetSupervisorStatsUseCase**
```typescript
Input:
- supervisorId: string

Output:
- success: boolean
- data?: GetSupervisorStatsOutput (includes computed properties)
- error?: string

Responsibilities:
- Validate input
- Fetch stats from repository
- Calculate derived metrics
- Determine health status
- Package results with metadata
```

#### DTOs

All DTOs follow naming convention:
- Input DTOs: `Get{Entity}{Field}Input`
- Output DTOs: `Get{Entity}{Field}Output`

Key DTOs:
- `GetSupervisorProfileInput/Output`
- `GetSupervisorStatsInput/Output`
- `GetTeamMembersInput/Output`
- `SearchSupervisorsInput/Output`
- `UpdateSupervisorProfileInput`
- `TeamMemberOutput`
- `Result<T>` - Generic result wrapper

### 3. Infrastructure Layer

**Purpose:** Handles external communication (APIs), data persistence, and infrastructure-specific concerns.

**Files:**
- `infrastructure/repositories/SupervisorRepository.ts` - API client with retry logic and response mapping
- `infrastructure/services/SupervisorServiceImpl.ts` - Concrete implementation of ISupervisorService

#### SupervisorRepository

**Responsibilities:**
- HTTP API communication
- Request/response mapping
- Error handling & retry logic
- JWT authentication
- Timeout management

**Features:**
- Automatic retry (3 attempts with exponential backoff)
- Request timeout: 30 seconds
- JWT token support via `setAuthToken()`
- Response mapping from API DTOs to domain entities

**API Endpoints:**
```
GET /api/v1/supervisors/:supervisorId
GET /api/v1/supervisors/:supervisorId/stats
GET /api/v1/supervisors?department=...&experience_level=...
GET /api/v1/supervisors/:supervisorId/team-members?limit=...&offset=...
PATCH /api/v1/supervisors/:supervisorId
```

**Response Mapping:**
- `supervisor_id` → `supervisorId`
- `team_members` → `teamMembers`
- `avg_quality_score` → `avgQualityScore`
- etc.

#### SupervisorServiceImpl

**Responsibilities:**
- Implement ISupervisorService interface
- Coordinate repository and use cases
- Manage service lifecycle

**Methods:**
```typescript
getSupervisorProfile(supervisorId): Promise<SupervisorProfile>
getSupervisorStats(supervisorId): Promise<SupervisorStats>
searchSupervisors(criteria?): Promise<SupervisorProfile[]>
getTeamMembers(supervisorId, options?): Promise<TeamMember[]>
updateSupervisorProfile(supervisorId, updates): Promise<SupervisorProfile>
setAuthToken(token): void
getProfileUseCase(): GetSupervisorProfileUseCase
getStatsUseCase(): GetSupervisorStatsUseCase
```

### 4. Presentation Layer

**Purpose:** React components and hooks for user interface. Completely isolated from domain logic through dependency injection.

**Files:**
- `presentation/components/SupervisorDashboard.tsx` - Main orchestrator component
- `presentation/components/SupervisorProfileHeader.tsx` - Profile display component
- `presentation/components/SupervisorStatsGrid.tsx` - 8-stat card grid
- `presentation/components/TeamMembersTable.tsx` - Team data table
- `presentation/hooks/useSupervisorProfile.ts` - Profile fetching hook
- `presentation/hooks/useSupervisorStats.ts` - Stats fetching hook

#### Components

**SupervisorDashboard**
- Main orchestrator component
- Manages refresh logic and concurrent data fetching
- Displays error boundaries
- Shows loading states
- Coordinates all child components

Props:
```typescript
interface SupervisorDashboardProps {
  supervisorId: string;
  onRefresh?: () => void;
}
```

**SupervisorProfileHeader**
- Displays supervisor avatar, name, and key info
- Shows performance rating with star visualization
- Experience level badge
- Active status indicator
- Summary statistics

Props:
```typescript
interface SupervisorProfileHeaderProps {
  profile: GetSupervisorProfileOutput;
}
```

**SupervisorStatsGrid**
- 8-stat card layout with color coding
- Health score overview with progress bar
- Status indicators (Excellent/Good/Fair/Poor)
- Responsive grid (1 col mobile, 2 col tablet, 4 col desktop)
- Alert banner for critical status

Stats Cards:
1. Team Members
2. Active Sessions
3. Quality Score
4. Total Workload
5. Team Productivity
6. Session Utilization
7. Average Workload Per Member
8. Health Status

**TeamMembersTable**
- Paginated team member list
- Sort by name, performance, or join date
- Status badges (Active/Inactive/On Leave)
- Performance rating with progress bars
- Search and filter capabilities

Columns:
- Name (with avatar)
- Role
- Department
- Status
- Performance (visual bar + numeric)
- Join Date

#### Custom Hooks

**useSupervisorProfile**
```typescript
// Manages profile data fetching and state
const { data, loading, error, refetch } = useSupervisorProfile(supervisorId);

State:
- data: GetSupervisorProfileOutput | null
- loading: boolean
- error: string | null

Methods:
- refetch(): Promise<void> - Manual refresh
```

**useSupervisorStats**
```typescript
// Manages stats data fetching and state
const { data, loading, error, refetch } = useSupervisorStats(supervisorId);

State:
- data: GetSupervisorStatsOutput | null
- loading: boolean
- error: string | null

Methods:
- refetch(): Promise<void> - Manual refresh
```

## Data Flow

```
User Interaction
      ↓
React Component
      ↓
Custom Hook (useSupervisor*)
      ↓
SupervisorServiceImpl
      ↓
Use Case (GetSupervisor*UseCase)
      ↓
SupervisorRepository
      ↓
API Backend
      ↓
Response → Domain Entity → DTO → Component
```

## Type Safety

### End-to-End Type Flow

```typescript
// 1. Entity receives validated data
const profile: SupervisorProfile = new SupervisorProfile({...})

// 2. Use case transforms to DTO
const output: GetSupervisorProfileOutput = {
  id: profile.id,
  userId: profile.userId,
  // ...
}

// 3. Hook types the result
const { data: GetSupervisorProfileOutput } = useSupervisorProfile()

// 4. Component receives typed props
<SupervisorProfileHeader profile={profile} />
```

### Validation Layers

1. **Entity Level** - Validation in constructor
2. **Use Case Level** - Input validation
3. **Component Level** - Prop validation with TypeScript
4. **API Level** - Retry & timeout handling

## Configuration

**File:** `config/supervisor.config.ts`

```typescript
Interface SupervisorConfig:
- api.baseUrl: API endpoint
- api.timeout: Request timeout (15-30s)
- api.retries: Retry attempts (3)
- cache.profileTTL: 5 minutes
- cache.statsTTL: 2 minutes
- features.enableNotifications: true
- features.enableExport: true
- features.enableAnalytics: env-dependent
- ui.pageSize: 20
- ui.refreshInterval: 30s (dev) / 60s (prod)
- ui.theme: 'light' | 'dark'
```

**Environment Variables:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_THEME=light
NODE_ENV=production|development
```

## Error Handling

### Strategy

1. **Domain Layer** - Validation errors thrown as exceptions
2. **Use Case Layer** - Caught and returned as Result<T>
3. **Repository Layer** - Retry logic with exponential backoff
4. **Component Layer** - Error boundaries and user feedback

### Error Types

```typescript
// Validation errors
- Invalid input format
- Missing required fields
- Out of range values

// Network errors
- API timeout
- Connection refused
- Invalid response format

// Business errors
- Supervisor not found
- Unauthorized access
- Rate limit exceeded
```

### User Feedback

- Toast notifications for transient errors
- Error banners for critical failures
- Loading states during operations
- Retry buttons for failed requests

## Performance Optimizations

1. **Concurrent Fetching**
   - Profile and stats fetched in parallel
   - `Promise.all([profileState.refetch(), statsState.refetch()])`

2. **Memoization**
   - Hooks prevent unnecessary re-renders
   - Use `useCallback` for event handlers

3. **Lazy Loading**
   - Team members table paginated
   - Stats grid rendered only when data available

4. **Caching**
   - Profile cache: 5 minutes
   - Stats cache: 2 minutes

## Testing

**Test File:** `supervisor.test.ts`

**Coverage:** 20+ tests across all layers

### Test Categories

1. **Domain Tests** (8 tests)
   - Entity creation and validation
   - Business logic methods
   - Edge cases and error conditions

2. **Application Tests** (3 tests)
   - Use case execution
   - Input validation
   - Error handling

3. **Infrastructure Tests** (2 tests)
   - Configuration loading
   - Service initialization

4. **Integration Tests** (2 tests)
   - Component coordination
   - Auth token management

5. **Edge Case Tests** (5+ tests)
   - Invalid inputs
   - Boundary conditions
   - Zero/null handling

## Security Considerations

1. **Authentication**
   - JWT token support via `setAuthToken()`
   - Authorization headers in all API requests

2. **Input Validation**
   - All inputs validated at entity level
   - Email format validation
   - Range checking for numeric values

3. **Data Isolation**
   - Each supervisor can only access own data
   - Team members access controlled via supervisor ID

4. **Error Messages**
   - Generic errors returned to UI
   - Detailed errors logged server-side only

## Scalability

1. **Pagination**
   - Team members list paginated (limit/offset)
   - Configurable page size (20 per page)

2. **Lazy Loading**
   - Components load only visible data
   - Stats calculated on-demand

3. **Caching Strategy**
   - Different TTLs for different data types
   - Cache invalidation on updates

4. **API Optimization**
   - Concurrent requests when possible
   - Minimal data transfer with DTOs

## Future Enhancements

1. Real-time updates via WebSocket
2. Offline support with service workers
3. Advanced filtering and search
4. Export to CSV/PDF functionality
5. Performance trend analysis
6. Team member insights and recommendations
7. Automated alerts and notifications
8. Multi-language support

## Development Workflow

### Adding a New Feature

1. Define domain entity if needed
2. Create use case in application layer
3. Add repository methods in infrastructure
4. Create service method
5. Build React component
6. Add custom hook if needed
7. Write tests
8. Update documentation

### Debugging

```typescript
// Enable verbose logging
process.env.DEBUG = 'supervisor:*'

// Mock service for development
const mockService = {
  getSupervisorProfile: async () => mockProfile,
  getSupervisorStats: async () => mockStats,
  // ...
}
```

## Deployment

### Prerequisites
- Node.js 18+
- TypeScript 5+
- React 18+
- Next.js 14+

### Build
```bash
npm run build
npm run test
```

### Environment Setup
```
NEXT_PUBLIC_API_BASE_URL=https://api.peercove.com
NODE_ENV=production
```

## Related Modules

- **Listener Module** - Similar pattern for therapist management
- **Member Module** - User profile and account management
- **Admin Module** - Platform administration

## Module Statistics

- **Total Files:** 18
- **Domain Layer:** 3 files (350 LOC)
- **Application Layer:** 2 files (300 LOC)
- **Infrastructure Layer:** 2 files (400 LOC)
- **Presentation Layer:** 6 files (800 LOC)
- **Configuration:** 1 file (100 LOC)
- **Tests:** 1 file (450 LOC)
- **Documentation:** 2 files (2500 LOC)
- **Total LOC:** ~5,300

## Architectural Principles

1. **Separation of Concerns** - Each layer has single responsibility
2. **Dependency Inversion** - Domain layer has no external dependencies
3. **Type Safety** - Full TypeScript coverage
4. **Error Handling** - Comprehensive error management
5. **Testability** - Easy to mock and test
6. **Maintainability** - Clear structure and documentation
7. **Scalability** - Pagination and lazy loading built-in
8. **Reusability** - Components and hooks are modular

---

**Last Updated:** 2024
**Module Version:** 1.0.0
**Status:** Production Ready
