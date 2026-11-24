# Member Module - Clean Architecture Documentation

## Overview

The Member Module implements a production-ready member dashboard with **4-layer clean architecture** ensuring maximum separation of concerns, testability, and maintainability.

### Architecture Layers

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (UI Components)         │
│  - React Components                         │
│  - Custom Hooks (useMemberProfile, etc)     │
│  - Error Boundaries & Loading States        │
└────────────────┬────────────────────────────┘
                 │ depends on
┌────────────────▼────────────────────────────┐
│  Application Layer (Use Cases)              │
│  - GetMemberProfileUseCase                  │
│  - GetDashboardStatsUseCase                 │
│  - Input/Output DTOs                        │
│  - Business Rules Orchestration             │
└────────────────┬────────────────────────────┘
                 │ depends on
┌────────────────▼────────────────────────────┐
│  Domain Layer (Business Logic)              │
│  - MemberProfile Entity                     │
│  - DashboardStats Entity                    │
│  - IMemberService Interface                 │
│  - 100% Framework Independent               │
└────────────────┬────────────────────────────┘
                 │ depends on
┌────────────────▼────────────────────────────┐
│  Infrastructure Layer (External Systems)    │
│  - MemberRepository (API Client)            │
│  - MemberServiceImpl (Service)               │
│  - API Response Mapping                     │
│  - Error Handling & Retry Logic             │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
src/modules/client/peercove/member/
├── domain/
│   ├── entities/
│   │   ├── MemberProfile.ts       # Domain entity with validation
│   │   └── DashboardStats.ts      # Domain entity with business logic
│   └── interfaces/
│       └── IMemberService.ts      # Service contract
│
├── application/
│   └── usecases/
│       ├── GetMemberProfileUseCase.ts
│       └── GetDashboardStatsUseCase.ts
│
├── infrastructure/
│   ├── repositories/
│   │   └── MemberRepository.ts    # API communication layer
│   └── services/
│       └── MemberServiceImpl.ts    # Service implementation
│
├── presentation/
│   ├── components/
│   │   ├── MemberDashboard.tsx    # Main orchestrator
│   │   ├── ProfileHeader.tsx      # Profile display
│   │   ├── DashboardStatsGrid.tsx # Stats grid layout
│   │   └── StatCard.tsx           # Reusable stat card
│   └── hooks/
│       ├── useMemberProfile.ts    # React hook for profile
│       └── useDashboardStats.ts   # React hook for stats
│
├── config/
│   └── member.config.ts           # Configuration & validation
│
└── member.test.ts                 # Integration tests
```

## Key Architectural Principles

### 1. **Separation of Concerns**
Each layer has a single responsibility:
- **Domain**: Pure business logic with zero external dependencies
- **Application**: Use case orchestration and validation
- **Infrastructure**: External system integration
- **Presentation**: UI rendering and user interaction

### 2. **Dependency Inversion**
```typescript
// ✅ GOOD: Infrastructure depends on Domain (via interface)
class MemberServiceImpl implements IMemberService {
  // Implementation
}

// ✗ BAD: Would create tight coupling
class MemberRepository extends MemberService {
  // Violates dependency inversion
}
```

### 3. **Entity Validation at Construction**
```typescript
// Validation happens in constructor - invalid objects cannot exist
const profile = new MemberProfile({
  email: "invalid-email" // Throws immediately
});
```

### 4. **Use Cases with Typed I/O**
```typescript
// Each use case has structured input and output
const result = await useCase.execute({ userId: "123" });
if (result.success) {
  const profile: MemberProfile = result.data;
}
```

## Component Documentation

### Domain Layer

#### `MemberProfile` Entity
- **Purpose**: Represents a member's profile information
- **Validation**: Email format, display name not empty
- **Methods**: Getters for immutable access to properties
- **Testability**: Can be instantiated and tested without any external dependencies

```typescript
const profile = new MemberProfile({
  id: "1",
  userId: "user-123",
  displayName: "John Doe",
  email: "john@example.com",
  joinedDate: new Date(),
  lastActive: new Date(),
});

profile.getDisplayName(); // "John Doe"
profile.getEmail(); // "john@example.com"
```

#### `DashboardStats` Entity
- **Purpose**: Encapsulates dashboard statistics with calculated business logic
- **Methods**:
  - `getAppointmentCompletionRate()`: Calculates completion percentage
  - `hasActiveEngagement()`: Detects if user is actively engaged
- **Immutable**: All properties set at construction

```typescript
const stats = new DashboardStats({
  totalAppointments: 10,
  completedAppointments: 8,
  // ... other properties
});

stats.getAppointmentCompletionRate(); // 80
stats.hasActiveEngagement(); // true if checkinsThisWeek > 0
```

#### `IMemberService` Interface
- **Purpose**: Contract that all member services must implement
- **Methods**: Defines all member-related operations
- **Usage**: Enables dependency injection and testing

```typescript
interface IMemberService {
  getMemberProfile(userId: string): Promise<MemberProfile>;
  getDashboardStats(userId: string): Promise<DashboardStats>;
  updateMemberProfile(userId: string, updates: Partial<...>): Promise<MemberProfile>;
  getRecentWellnessData(userId: string, limit?: number): Promise<WellnessData[]>;
}
```

### Application Layer

#### `GetMemberProfileUseCase`
- **Purpose**: Orchestrates fetching a member's profile
- **Input**: `{ userId: string }`
- **Output**: `{ success: boolean; data?: MemberProfile; error?: string }`
- **Responsibilities**:
  - Input validation (userId not empty)
  - Service invocation
  - Error handling and wrapping

```typescript
const useCase = new GetMemberProfileUseCase(memberService);
const result = await useCase.execute({ userId: "user-123" });

if (result.success && result.data) {
  console.log(result.data.getDisplayName());
} else {
  console.error(result.error);
}
```

#### `GetDashboardStatsUseCase`
- **Purpose**: Orchestrates fetching dashboard statistics
- **Input**: `{ userId: string }`
- **Output**: `{ success: boolean; data?: DashboardStats; error?: string }`
- **Same pattern as GetMemberProfileUseCase**

### Infrastructure Layer

#### `MemberRepository`
- **Purpose**: Handles all API communication with the backend
- **Responsibilities**:
  - Fetch API calls to backend
  - Response mapping to domain entities
  - Error handling and retry logic
  - JWT token management
- **Key Methods**:
  - `fetchProfile(userId)`: GET `/api/v1/members/{userId}`
  - `fetchDashboardStats(userId)`: GET `/api/v1/members/{userId}/dashboard`
  - `setAuthToken(token)`: Configure JWT for authenticated requests

```typescript
const repo = new MemberRepository();
repo.setAuthToken("jwt-token");

const profile = await repo.fetchProfile("user-123");
// Returns MemberProfile entity
```

#### `MemberServiceImpl`
- **Purpose**: Implements IMemberService with repository delegation
- **Responsibilities**:
  - Input validation
  - Repository coordination
  - Error propagation
- **All methods validate inputs and call repository**

```typescript
const service = new MemberServiceImpl(repository);
const profile = await service.getMemberProfile("user-123");
// Throws error if userId is empty
```

### Presentation Layer

#### `MemberDashboard` Component
- **Purpose**: Main orchestrator component combining all sub-components
- **Props**:
  - `userId: string` - ID of member to display
  - `onNavigate?: (path: string) => void` - Navigation callback
- **Features**:
  - Concurrent data fetching (profile + stats)
  - Loading and error states
  - Refresh button with retry tracking
  - Quick action buttons

```typescript
<MemberDashboard
  userId="user-123"
  onNavigate={(path) => router.push(path)}
/>
```

#### React Hooks

##### `useMemberProfile(userId: string)`
- **Returns**: `{ profile, loading, error, refetch }`
- **Behavior**: Fetches member profile on mount, refetch on demand

```typescript
const { profile, loading, error, refetch } = useMemberProfile("user-123");

if (loading) return <Skeleton />;
if (error) return <ErrorBoundary error={error} />;

return <h1>{profile.getDisplayName()}</h1>;
```

##### `useDashboardStats(userId: string)`
- **Returns**: `{ stats, loading, error, refetch }`
- **Behavior**: Fetches stats on mount, refetch on demand

#### UI Components

##### `StatCard`
- Reusable stat card with icon, value, label, and trend
- Props: `{ icon, label, value, trend?, trendPositive? }`

##### `ProfileHeader`
- Displays member profile with avatar, name, email
- Skeleton loading state during fetch
- Error fallback

##### `DashboardStatsGrid`
- Grid layout for all statistics
- Displays appointment overview, communication stats
- Handles loading and error states

## Configuration

All configuration is centralized in [`member.config.ts`](config/member.config.ts):

```typescript
import MEMBER_CONFIG from '@/modules/client/peercove/member/config/member.config';

// API Configuration
MEMBER_CONFIG.api.baseUrl // Default: http://localhost:8080/api/v1
MEMBER_CONFIG.api.timeout // Default: 10000ms
MEMBER_CONFIG.api.retryAttempts // Default: 3

// Feature Flags
MEMBER_CONFIG.features.enablePolling // Default: false
MEMBER_CONFIG.features.enableCaching // Default: true
MEMBER_CONFIG.features.cacheDuration // Default: 300000ms (5 min)

// Validation Rules
MEMBER_CONFIG.validation.emailPattern
MEMBER_CONFIG.validation.displayNameMinLength // 2
MEMBER_CONFIG.validation.displayNameMaxLength // 100
```

### Environment Variables

Configure via `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_API_RETRY_ATTEMPTS=3

# Feature Flags
NEXT_PUBLIC_ENABLE_POLLING=false
NEXT_PUBLIC_ENABLE_CACHING=true
NEXT_PUBLIC_CACHE_DURATION=300000

# Logging
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=warn
```

## Testing Strategy

### Unit Tests: Domain Layer
```typescript
describe('MemberProfile Entity', () => {
  it('should validate email format', () => {
    expect(() => {
      new MemberProfile({ ..., email: 'invalid' });
    }).toThrow();
  });
});
```

### Unit Tests: Use Cases
```typescript
describe('GetMemberProfileUseCase', () => {
  it('should handle empty userId', async () => {
    const result = await useCase.execute({ userId: '' });
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests
```typescript
describe('Member Module Integration', () => {
  it('should fetch profile and stats concurrently', async () => {
    const [profile, stats] = await Promise.all([
      profileUseCase.execute({ userId: 'user-1' }),
      statsUseCase.execute({ userId: 'user-1' }),
    ]);
    expect(profile.success).toBe(true);
    expect(stats.success).toBe(true);
  });
});
```

## Error Handling Strategy

### Layer-by-Layer Error Handling

1. **Domain Layer**: Validation errors thrown at construction
   ```typescript
   throw new Error("valid email is required");
   ```

2. **Application Layer**: Caught and wrapped in Result
   ```typescript
   try {
     const profile = await service.getMemberProfile(userId);
   } catch (err) {
     return { success: false, error: err.message };
   }
   ```

3. **Infrastructure Layer**: API errors mapped with context
   ```typescript
   const response = await fetch(url);
   if (!response.ok) {
     throw new Error(`API Error: ${response.status} ${response.statusText}`);
   }
   ```

4. **Presentation Layer**: Error states displayed with retry
   ```typescript
   {error && (
     <ErrorAlert message={error} onRetry={refetch} />
   )}
   ```

## API Contracts

### Backend Endpoints Required

All endpoints expect `Authorization: Bearer {JWT_TOKEN}` header.

#### GET `/api/v1/members/{userId}`
**Response:**
```json
{
  "id": "member-1",
  "userId": "user-123",
  "displayName": "John Doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Health enthusiast",
  "organization": "Test Org",
  "joinedDate": "2024-01-01T00:00:00Z",
  "lastActive": "2024-01-15T14:30:00Z"
}
```

#### GET `/api/v1/members/{userId}/dashboard`
**Response:**
```json
{
  "checkinsThisWeek": 5,
  "savedReflections": 12,
  "activeGoals": 3,
  "openSupportRequests": 2,
  "openConversations": 1,
  "queuedNotifications": 4,
  "openPrivacyRequests": 0,
  "totalAppointments": 10,
  "completedAppointments": 8,
  "pendingAppointments": 1,
  "cancelledAppointments": 1
}
```

#### GET `/api/v1/members/{userId}/wellness?limit=20`
**Response:**
```json
{
  "data": [
    {
      "id": "wellness-1",
      "type": "mood",
      "value": "happy",
      "recordedAt": "2024-01-15T14:30:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

## Authentication Flow

1. **Token Storage**: Stored in localStorage via Better Auth (port 5001)
2. **Token Injection**: Repository retrieves token and adds to requests
3. **Token Refresh**: 401 responses trigger re-authentication
4. **Logout**: Token cleared from storage

```typescript
// In MemberRepository
const token = localStorage.getItem(MEMBER_CONFIG.auth.storageKey);
const headers = getAuthHeader(token);
const response = await fetch(url, { headers });
```

## Performance Considerations

### Caching
- Dashboard stats cached for 5 minutes (configurable)
- Profile cached separately
- Cache cleared on manual refresh

### Lazy Loading
- Profile header loads first
- Stats load independently
- Wellness data loaded on demand

### Code Splitting
- Each page route lazy-loaded
- Components split by module
- Hooks tree-shakeable

## Known Limitations & Future Work

### Current Limitations
1. **Base URL**: Hardcoded to localhost:8080 in production
   - **Solution**: Use environment variables (implemented)

2. **JWT Management**: Manual `setAuthToken()` method
   - **Solution**: Move to React Context for centralized auth

3. **No Pagination**: Wellness data hardcoded to limit 20
   - **Solution**: Implement cursor-based pagination

4. **No Caching**: Each fetch hits API
   - **Solution**: Implement SWR or React Query

5. **No Real-time Updates**: No polling or WebSocket
   - **Solution**: Optional polling via feature flag

### Future Enhancements
- [ ] Real-time dashboard updates via WebSocket
- [ ] Offline support with IndexedDB
- [ ] Advanced caching with SWR
- [ ] A/B testing framework integration
- [ ] Analytics event tracking
- [ ] Performance monitoring
- [ ] Advanced error recovery strategies

## Integration Checklist

- [x] Domain entities created and validated
- [x] Application use cases implemented
- [x] Infrastructure layer with API integration
- [x] React hooks for data fetching
- [x] UI components with loading/error states
- [x] Configuration centralized
- [x] Tests written (unit, integration)
- [x] Page route created with auth check
- [ ] Backend endpoints verified (pending)
- [ ] JWT authentication flow tested (pending)
- [ ] End-to-end testing (pending)
- [ ] Performance optimization (pending)
- [ ] Production deployment (pending)

## Quick Start

### 1. Setup Authentication
```typescript
// In layout or auth provider
memberService.setAuthToken(session.accessToken);
```

### 2. Render Dashboard
```typescript
<MemberDashboard userId={session.user.id} />
```

### 3. Configure API Base URL
```env
NEXT_PUBLIC_API_BASE_URL=http://your-api:8080/api/v1
```

### 4. Run Tests
```bash
npm test -- member.test.ts
```

## Troubleshooting

### Dashboard Not Loading
1. Check browser console for network errors
2. Verify API base URL in config
3. Confirm JWT token is present and valid
4. Check CORS headers on backend

### Styles Not Applied
1. Ensure ShadcN UI is installed
2. Verify `@/components/ui/skeleton` path
3. Check Tailwind CSS configuration

### Data Not Fetching
1. Verify backend endpoints exist
2. Check Authorization header format
3. Test API endpoints with Postman
4. Check token expiration

## Support

For questions or issues:
1. Check this documentation
2. Review test files for usage examples
3. Check browser DevTools Network tab
4. Review backend API logs
