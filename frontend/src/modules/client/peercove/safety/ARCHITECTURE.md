/**
 * SAFETY MODULE - ARCHITECTURE DOCUMENT
 * 
 * Detailed technical architecture, design decisions, and implementation patterns.
 * Comprehensive guide for developers working with the Safety Module.
 * 
 * @version 1.0.0
 * @created 2024-01-15
 */

# Safety Module - Architecture Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Layer-by-Layer Design](#layer-by-layer-design)
3. [Data Flow](#data-flow)
4. [Design Patterns](#design-patterns)
5. [Error Handling Strategy](#error-handling-strategy)
6. [Dependency Injection](#dependency-injection)
7. [State Management](#state-management)
8. [Performance Optimization](#performance-optimization)
9. [Testing Strategy](#testing-strategy)
10. [Scalability & Maintainability](#scalability--maintainability)

## Architecture Overview

The Safety Module follows a **4-layer Clean Architecture** pattern, ensuring separation of concerns, testability, and maintainability.

```
┌──────────────────────────────────────────────────────┐
│          PRESENTATION LAYER                          │
│  ┌─ SafetyDashboard (Orchestrator)                  │
│  ├─ SafetyProfileHeader                             │
│  ├─ SafetyStatsGrid                                 │
│  ├─ AlertsTable                                     │
│  └─ Hooks (useSafetyProfile, useSafetyStats)       │
├──────────────────────────────────────────────────────┤
│          APPLICATION LAYER                          │
│  ┌─ Use Cases                                        │
│  │  ├─ GetSafetyProfileUseCase                      │
│  │  └─ GetSafetyStatsUseCase                        │
│  └─ DTOs (with Result<T> pattern)                   │
├──────────────────────────────────────────────────────┤
│          INFRASTRUCTURE LAYER                       │
│  ┌─ Repository Pattern                              │
│  │  └─ SafetyRepository (API Client)                │
│  └─ Service Implementation                          │
│     └─ SafetyServiceImpl                             │
├──────────────────────────────────────────────────────┤
│          DOMAIN LAYER                               │
│  ┌─ Entities                                        │
│  │  ├─ SafetyProfile                                │
│  │  └─ SafetyStats                                  │
│  └─ Interfaces                                      │
│     └─ ISafetyService                               │
└──────────────────────────────────────────────────────┘
```

## Layer-by-Layer Design

### Domain Layer (`domain/`)

**Responsibility**: Core business logic, entity definitions, and service contracts.

#### Entities

**SafetyProfile**
- Represents a user's safety assessment profile
- Contains validation logic in constructor
- Provides immutable getters for all properties
- Business logic methods:
  - `getRiskLevel()`: Maps score to level
  - `isHighRisk()`: Score >= 60
  - `isCritical()`: Score >= 80
  - `needsImmediateAttention()`: Needs intervention && is_active
  - `isAssessmentOverdue()`: Last assessment > 30 days ago

**SafetyStats**
- Represents aggregated safety metrics
- Validates data consistency
- Calculates derived metrics:
  - `getTotalUrgentCases()`: high_risk_users + critical_cases
  - `getEscalationRate()`: escalations_made / incidents_reported
  - `getOverallHealthScore()`: Weighted calculation
  - `getSystemStatus()`: Maps health score to status

#### Interfaces

**ISafetyService**
- Defines contract for safety operations
- Methods organized by domain concern:
  - Profile operations (get, search, filter)
  - Stats operations (fetch, aggregate)
  - Alert operations (get, acknowledge, escalate)
  - Assessment operations (get, update)

### Application Layer (`application/`)

**Responsibility**: Use case orchestration, business logic coordination, DTO mapping.

#### Use Cases

**GetSafetyProfileUseCase**
```
Input Validation
    ↓
Service Call
    ↓
Entity Validation
    ↓
DTO Mapping
    ↓
Result<T> Return
```

**GetSafetyStatsUseCase**
```
Input Validation
    ↓
Service Call
    ↓
Calculation (health_score, system_status)
    ↓
DTO Mapping
    ↓
Result<T> Return
```

#### Result<T> Pattern

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    timestamp: string;      // ISO 8601
    duration: number;       // ms
  };
}
```

Benefits:
- Type-safe error handling
- Performance tracking
- Consistent API responses
- No exception-based flow control

### Infrastructure Layer (`infrastructure/`)

**Responsibility**: External service integration, API communication, repository pattern.

#### SafetyRepository

**API Communication**
```typescript
fetchAPI<T>(url: string, options: RequestInit)
  ├─ Request: Headers, Auth, Body
  ├─ Retry Logic: 3 attempts with exponential backoff
  ├─ Error Handling: 401, 403, 404, 5xx
  └─ Response: Parsed JSON or Error
```

**Retry Strategy**
- Max retries: 3
- Retry delay: 1000ms * attempt number
- Skip retries for: 401 Unauthorized
- Timeout: 30 seconds per request

**DTO Mapping**
```
API Response (DTOs)
    ↓
Validation (Domain layer)
    ↓
Domain Entities
    ↓
Use Case Output DTOs
```

#### SafetyServiceImpl

- Implements ISafetyService contract
- Delegates to SafetyRepository
- No business logic (coordination only)
- Dependency injection: receives repository in constructor

### Presentation Layer (`presentation/`)

**Responsibility**: React components, UI state management, user interactions.

#### Components

**SafetyDashboard**
- Orchestrator component
- Manages sub-component composition
- Auto-refresh: Default 30 seconds
- Error handling & display
- Action buttons (Refresh, Export)

**SafetyProfileHeader**
- Displays user profile information
- Risk score visualization with progress bar
- Status indicators (active/inactive)
- Intervention requirement display
- Color-coded by risk level

**SafetyStatsGrid**
- 8 stat cards with color-coded alerts
- System health overview
- Trend indicators (up/down/stable)
- Responsive: 1 col (mobile) → 4 col (desktop)

**AlertsTable**
- Sortable alert display
- Severity color-coding
- Status indicators (new/acknowledged)
- Action buttons (acknowledge/escalate)
- Timestamp formatting

#### Hooks

**useSafetyProfile**
```typescript
const { profile, loading, error, refetch } = useSafetyProfile(profileId)

Effect Flow:
  profileId changes
    ↓
  Set loading = true
    ↓
  Create service (repository → service → usecase)
    ↓
  Execute use case
    ↓
  Update state (profile/error)
```

**useSafetyStats**
- Similar pattern to useSafetyProfile
- Returns stats instead of profile

## Data Flow

### Complete Request Flow

```
User Interaction (Click/Load)
    ↓
React Hook (useSafetyProfile/useSafetyStats)
    ↓
Use Case Execution (GetSafetyProfileUseCase)
    ↓
Service Call (SafetyServiceImpl)
    ↓
Repository Call (SafetyRepository)
    ↓
HTTP Request (Fetch API + Auth)
    ↓
API Response
    ↓
DTO Mapping
    ↓
Domain Entity Creation
    ↓
Result<T> Construction
    ↓
State Update
    ↓
Component Re-render
    ↓
UI Update
```

### Component Communication

```
SafetyDashboard
├─ SafetyProfileHeader (receives profile data)
├─ SafetyStatsGrid (receives stats data)
└─ AlertsTable (receives alerts data)
    └─ Action Handlers
       ├─ onAcknowledge → service call
       ├─ onEscalate → service call
       └─ Optimistic UI update
```

## Design Patterns

### 1. Clean Architecture / Onion Architecture
Layers depend inward, domain layer has no external dependencies.

### 2. Repository Pattern
- Abstracts data access
- SafetyRepository handles API communication
- Easy to mock for testing
- Single responsibility

### 3. Dependency Injection
```typescript
// Bad: Tightly coupled
const useCase = new GetSafetyProfileUseCase();

// Good: Dependencies injected
const service = new SafetyServiceImpl(repository);
const useCase = new GetSafetyProfileUseCase(service);
```

### 4. Result<T> Pattern
- Type-safe error handling
- No exception-based flow control
- Consistent error responses
- Performance metadata included

### 5. Hook Pattern (React)
- Encapsulates fetch logic
- State management
- Error handling
- Auto-retry capability

### 6. Entity Validation Pattern
```typescript
class SafetyProfile {
  constructor(props) {
    this.validateProfile(props);  // Fail fast
    this.props = props;           // Store if valid
  }
}
```

### 7. Immutable Access Pattern
```typescript
get risk_score(): number {
  return this.props.risk_score;  // Read-only access
}

// No setters - entities are immutable after creation
```

## Error Handling Strategy

### Layer-by-Layer Error Handling

**Domain Layer**
```typescript
// Constructor validation - fail fast
if (!props.email || !isValidEmail(props.email)) {
  throw new Error('Valid email is required');
}
```

**Application Layer**
```typescript
try {
  const profile = await service.getSafetyProfile(id);
  return { success: true, data: output, metadata };
} catch (error) {
  return { success: false, error: message, metadata };
}
```

**Infrastructure Layer**
```typescript
// Retry logic with backoff
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY * attempt);
      continue;
    }
    throw error;
  }
}
```

**Presentation Layer**
```typescript
try {
  const result = await useCase.execute(input);
  if (result.success) {
    setState({ profile: result.data, error: null });
  } else {
    setState({ profile: null, error: result.error });
  }
} catch (err) {
  setState({ error: 'Unexpected error' });
}
```

### Error Types & Handling

| Error Type | Source | Handling | User Message |
|-----------|--------|----------|--------------|
| Validation | Domain | Throw immediately | "Invalid input" |
| Network | Infrastructure | Retry with backoff | "Network error" |
| API | Infrastructure | Pass through error message | "Failed to load data" |
| Unauthorized | API (401) | No retry, refresh token | "Session expired" |
| NotFound | API (404) | No retry | "Resource not found" |
| Unexpected | Any | Log & fallback | "Something went wrong" |

## Dependency Injection

### Service Construction Pattern

```typescript
// Step 1: Create repository
const repository = new SafetyRepository(baseUrl);
repository.setAuthToken(token);

// Step 2: Create service with repository
const service = new SafetyServiceImpl(repository);

// Step 3: Create use case with service
const useCase = new GetSafetyProfileUseCase(service);

// Step 4: Execute
const result = await useCase.execute(input);
```

### Benefits
- Loose coupling between layers
- Easy to mock for testing
- Single responsibility
- Flexibility to swap implementations

## State Management

### Hook-Based State Management

```typescript
interface State {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Managed per hook instance
const [state, setState] = useState<State>({
  data: null,
  loading: false,
  error: null,
});
```

### State Transitions

```
Initial
  ↓ (on profileId change)
Loading ← ← ← ← ← (refetch called)
  ↓
Success OR Error
  ↓
Final (refetch available)
```

### Lifecycle Hooks

```typescript
// Fetch on mount & when profileId changes
useEffect(() => {
  fetchProfile();
}, [profileId]);

// Auto-refresh at interval
useEffect(() => {
  const interval = setInterval(refetch, autoRefreshInterval);
  return () => clearInterval(interval);
}, [autoRefreshInterval]);
```

## Performance Optimization

### 1. Caching Strategy
- **Client-side caching**: Configurable TTL (default 5 minutes)
- **API response caching**: Prevent duplicate requests
- **Skip cache headers**: Support force-refresh

### 2. Request Optimization
- **Pagination**: Default 20, max 100 items
- **Filtering**: Server-side to reduce payload
- **Selective fields**: Only request needed data

### 3. Component Optimization
- **Memoization**: React.memo for expensive sub-components
- **Lazy loading**: Load components on demand
- **Code splitting**: Separate Safety module from main bundle

### 4. Rendering Optimization
- **Conditional rendering**: Don't render unused components
- **CSS-in-JS**: Scoped styles, no global pollution
- **Virtual scrolling**: For large alert tables

## Testing Strategy

### Unit Tests (Domain Layer)

```typescript
describe('SafetyProfile', () => {
  it('should validate email format', () => {
    expect(() => new SafetyProfile({
      ...validProps,
      email: 'invalid'
    })).toThrow('Valid email is required');
  });

  it('should calculate risk level correctly', () => {
    const profile = new SafetyProfile({ ...validProps, risk_score: 70 });
    expect(profile.getRiskLevel()).toBe('high');
  });
});
```

### Integration Tests (Use Cases)

```typescript
describe('GetSafetyProfileUseCase', () => {
  it('should return error for invalid input', async () => {
    const result = await useCase.execute({ profileId: '' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Component Tests (Presentation Layer)

```typescript
describe('SafetyProfileHeader', () => {
  it('should display risk score', () => {
    render(<SafetyProfileHeader riskScore={70} ... />);
    expect(screen.getByText('70')).toBeInTheDocument();
  });
});
```

## Scalability & Maintainability

### Module Extensibility

**Adding New Feature**
1. Define domain entity (if needed)
2. Add interface method to ISafetyService
3. Implement in SafetyRepository & SafetyServiceImpl
4. Create use case
5. Create component/hook
6. Add tests

**Adding New Component**
1. Create `.tsx` file in `presentation/components/`
2. Import required types
3. Use hooks or services as needed
4. Style with Tailwind CSS

### Code Organization

```
safety/
├── domain/
│   ├── entities/       (Business models)
│   └── interfaces/     (Contracts)
├── application/
│   ├── usecases/       (Business logic)
│   └── dto/            (Data transfer)
├── infrastructure/
│   ├── repositories/   (Data access)
│   └── services/       (Implementation)
├── presentation/
│   ├── components/     (React components)
│   └── hooks/          (Custom hooks)
├── config/             (Configuration)
├── safety.test.ts      (Tests)
├── README.md           (User guide)
└── ARCHITECTURE.md     (This file)
```

### Naming Conventions

- **Entities**: PascalCase, descriptive (SafetyProfile, SafetyStats)
- **Functions**: camelCase (getRiskLevel, isHighRisk)
- **Types**: PascalCase (SafetyProfileProps, Result)
- **Files**: PascalCase for components/classes, camelCase for utils
- **Constants**: UPPER_SNAKE_CASE (MAX_RETRIES, DEFAULT_TIMEOUT)

### Code Quality Standards

- **Type Safety**: Full TypeScript, no `any`
- **Error Handling**: Try-catch or Result<T> pattern
- **Validation**: Fail fast at boundary (domain layer)
- **Immutability**: Entities read-only after creation
- **SOLID Principles**: S (single responsibility), O (open/closed), L (liskov), I (interface segregation), D (dependency inversion)

## Deployment Considerations

### Environment Configuration

```
Development: 
  - Local API endpoint
  - Verbose logging
  - Longer cache TTL

Staging:
  - Staging API
  - Standard logging
  - Production-like config

Production:
  - Production API
  - Error logging only
  - Optimized performance
```

### Performance Targets

- Component load: < 1 second
- API response: < 500ms (95th percentile)
- Dashboard render: < 2 seconds
- Alert table: < 3 seconds for 100 items

### Security Checklist

- ✅ JWT token validation
- ✅ Input validation
- ✅ Output encoding
- ✅ HTTPS enforcement
- ✅ CORS policy
- ✅ SQL injection prevention (via parameterized queries)
- ✅ Rate limiting (backend)

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Architecture Pattern**: Clean Architecture / Onion Architecture  
**Status**: Production Ready  
**Maintainability Index**: High
