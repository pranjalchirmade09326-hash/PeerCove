# Listener Module - Architecture & Integration Guide

## 📋 Overview

The Listener Module implements a complete 4-layer clean architecture for managing listener (therapist/counselor) profiles and statistics in the PeerCove platform. This module demonstrates professional code organization, type safety, and proper separation of concerns.

**Key Features**:
- ✅ Listener profile management with verification
- ✅ Performance statistics and metrics
- ✅ Real-time availability checking
- ✅ Specialization-based search
- ✅ Comprehensive error handling
- ✅ Type-safe implementation with TypeScript
- ✅ Full test coverage

---

## 🏗️ Architecture Overview

### 4-Layer Clean Architecture

```
┌─────────────────────────────────────────────────────┐
│         Presentation Layer (React)                   │
│  - ListenerDashboard Component                       │
│  - ListenerProfileHeader Component                   │
│  - ListenerStatsGrid Component                       │
│  - useListenerProfile Hook                           │
│  - useListenerStats Hook                             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│      Application Layer (Use Cases)                   │
│  - GetListenerProfileUseCase                         │
│  - GetListenerStatsUseCase                           │
│  - DTOs (Input/Output types)                         │
│  - Result<T> wrapper for consistency                 │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│       Infrastructure Layer                           │
│  - ListenerRepository (API client)                   │
│  - ListenerServiceImpl (Domain service)               │
│  - Response mapping to domain entities               │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│        Domain Layer (Business Logic)                 │
│  - ListenerProfile (Entity)                          │
│  - ListenerStats (Entity)                            │
│  - IListenerService (Interface)                      │
│  - Pure business logic, no frameworks                │
└─────────────────────────────────────────────────────┘
```

### Dependency Flow
```
Presentation → Application → Infrastructure ↘
                                              Domain
                                            ↙
Infrastructure ←── Domain (Interface only)
```

---

## 📁 Project Structure

```
src/modules/client/peercove/listener/
├── domain/
│   ├── entities/
│   │   ├── ListenerProfile.ts      # Core listener profile entity
│   │   └── ListenerStats.ts        # Statistics and metrics entity
│   └── interfaces/
│       └── IListenerService.ts     # Domain service interface
├── application/
│   ├── usecases/
│   │   ├── GetListenerProfileUseCase.ts
│   │   └── GetListenerStatsUseCase.ts
│   └── dto/
│       └── index.ts                # Input/Output types
├── infrastructure/
│   ├── repositories/
│   │   └── ListenerRepository.ts   # API client with retry logic
│   └── services/
│       └── ListenerServiceImpl.ts   # Domain service implementation
├── presentation/
│   ├── components/
│   │   ├── ListenerDashboard.tsx   # Main orchestrator
│   │   ├── ListenerProfileHeader.tsx
│   │   └── ListenerStatsGrid.tsx
│   └── hooks/
│       ├── useListenerProfile.ts   # Profile data hook
│       └── useListenerStats.ts     # Stats data hook
├── config/
│   └── listener.config.ts          # Centralized configuration
├── listener.test.ts                # Integration tests (20+ tests)
├── ARCHITECTURE.md                 # This file
└── README.md                        # Quick start guide
```

---

## 🎯 Domain Layer

### ListenerProfile Entity

**Responsibilities**:
- Store listener information with immutable properties
- Validate data at construction time
- Provide business logic methods
- Enable safe domain operations

**Key Methods**:
```typescript
// Properties
profile.id
profile.firstName
profile.lastName
profile.fullName
profile.email
profile.specializations
profile.yearsOfExperience

// Business Logic
profile.isVerified()          // Check if listener is verified and active
profile.isExperienced()       // Check if has 3+ years experience
profile.hasSpecialization(spec: string)  // Check specific specialization
profile.getInitials()         // Get display initials
```

### ListenerStats Entity

**Responsibilities**:
- Store listener statistics and metrics
- Calculate derived metrics
- Assess availability and reliability
- Compute performance scores

**Key Methods**:
```typescript
// Properties
stats.totalClients
stats.activeClients
stats.completedSessions
stats.averageRating
stats.availableSlots

// Business Logic
stats.getClientRetention()         // Active clients / Total clients %
stats.getAverageSessionDuration()  // Total hours / Completed sessions
stats.getAvailabilityStatus()      // 'available' | 'limited' | 'unavailable'
stats.isReliable()                 // Low cancellation + fast response
stats.isHighRated()                // Rating >= 4.5 with 10+ reviews
stats.getWorkloadStatus()          // 'light' | 'moderate' | 'heavy'
stats.getPerformanceScore()        // Composite score 0-100
```

### IListenerService Interface

Defines contract for listener operations:
```typescript
interface IListenerService {
  // Profile operations
  getListenerProfile(listenerId: string): Promise<ListenerProfile>
  updateListenerProfile(listenerId: string, updates: Partial<ListenerProfile>): Promise<ListenerProfile>
  validateListenerLicense(licenseNumber: string): Promise<boolean>

  // Stats operations
  getListenerStats(listenerId: string): Promise<ListenerStats>
  updateListenerStats(listenerId: string, stats: Partial<ListenerStats>): Promise<ListenerStats>

  // Search and filter
  searchListenersBySpecialization(specialization: string, limit?: number): Promise<ListenerProfile[]>
  getVerifiedListeners(limit?: number): Promise<ListenerProfile[]>
  getAvailableListeners(): Promise<ListenerProfile[]>

  // Availability
  checkAvailability(listenerId: string): Promise<boolean>
  getAvailableSlots(listenerId: string): Promise<Date[]>
}
```

---

## 📱 Application Layer

### Use Cases

**GetListenerProfileUseCase**:
- Input validation
- Calls domain service
- Maps entity to output DTO
- Error handling with structured response
- Performance tracking

```typescript
const useCase = new GetListenerProfileUseCase(service);
const result = await useCase.execute({ listenerId: 'listener-123' });

if (result.success) {
  // result.data contains GetListenerProfileOutput
} else {
  // result.error contains error message
}
```

**GetListenerStatsUseCase**:
- Similar pattern to profile use case
- Calls domain methods to calculate metrics
- Returns enriched stats with derived values

### DTOs (Data Transfer Objects)

Input DTOs:
```typescript
interface GetListenerProfileInput { listenerId: string }
interface GetListenerStatsInput { listenerId: string }
interface SearchListenersInput { specialization?: string; minRating?: number; ... }
```

Output DTOs:
```typescript
interface GetListenerProfileOutput { id, firstName, lastName, email, ... }
interface GetListenerStatsOutput { totalClients, activeClients, performanceScore, ... }
```

### Result Wrapper

All use cases return `Result<T>`:
```typescript
interface Result<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: { timestamp: string; duration: number }
}
```

---

## 🔌 Infrastructure Layer

### ListenerRepository

**Responsibilities**:
- HTTP communication with backend
- Response mapping to domain entities
- Retry logic for failed requests
- JWT token management
- Error handling

**Key Features**:
- Configurable base URL
- Automatic retry with exponential backoff
- JWT token injection
- Request timeout (30 seconds default)
- Response mapping (DTO → Domain Entity)

```typescript
const repository = new ListenerRepository();
repository.setAuthToken(jwtToken);

const profile = await repository.fetchListenerProfile(listenerId);
const stats = await repository.fetchListenerStats(listenerId);
const listeners = await repository.searchListeners(specialization);
```

### ListenerServiceImpl

**Responsibilities**:
- Implement IListenerService interface
- Coordinate repository and domain
- Business logic orchestration
- Error handling

```typescript
const service = new ListenerServiceImpl(repository);
const profile = await service.getListenerProfile(listenerId);
const isVerified = await service.validateListenerLicense(licenseNumber);
```

---

## ⚛️ Presentation Layer

### Components

**ListenerDashboard** (Main Component):
- Orchestrates profile and stats display
- Handles refresh logic
- Error boundary and error states
- Loading states with spinners
- Concurrent data fetching

**ListenerProfileHeader**:
- Displays listener profile information
- Shows verification badge
- Lists specializations
- Experience and status
- Skeleton loading

**ListenerStatsGrid**:
- 8-stat grid layout
- Color-coded cards
- Performance metrics
- Availability status
- Skeleton loading

### Custom Hooks

**useListenerProfile**:
```typescript
const { profile, loading, error, refetch } = useListenerProfile(listenerId);

// profile: ListenerProfile | null
// loading: boolean
// error: string | null
// refetch: () => Promise<void>
```

**useListenerStats**:
```typescript
const { stats, loading, error, refetch } = useListenerStats(listenerId);

// stats: GetListenerStatsOutput | null
// loading: boolean
// error: string | null
// refetch: () => Promise<void>
```

---

## 🔧 Configuration

### listenerConfig Object

```typescript
listenerConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    timeout: 30000,
    retries: 3
  },
  cache: {
    enabled: false,
    duration: 300000  // 5 minutes
  },
  features: {
    enablePolling: false,
    enableWebsocket: false
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  messages: { /* ... */ }
}
```

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
LISTENER_API_TIMEOUT=30000
LISTENER_API_RETRIES=3

# Caching
LISTENER_CACHE_ENABLED=false
LISTENER_CACHE_DURATION=300000

# Features
LISTENER_ENABLE_POLLING=false
LISTENER_ENABLE_WEBSOCKET=false

# UI
LISTENER_SHOW_RATING=true
LISTENER_SHOW_AVAILABILITY=true
LISTENER_SHOW_STATS=true

# Validation
LISTENER_MIN_EXPERIENCE=0
LISTENER_MIN_RATING=3.5
LISTENER_REQUIRE_VERIFICATION=true
```

---

## 🧪 Testing

### Test Coverage

**Domain Layer** (6 tests):
- Valid entity creation
- Email validation
- License number validation
- Client retention calculation
- Availability status determination
- Specialization checking

**Application Layer** (6 tests):
- Successful profile fetching
- Use case error handling
- Stats calculation
- Metadata inclusion
- Input validation
- Result structure

**Infrastructure Layer** (3 tests):
- Repository validation
- Service implementation
- Concurrent operations

**Integration** (5+ tests):
- End-to-end entity to use case flow
- Performance metric calculations
- Concurrent data fetching
- Error scenarios
- Complete workflow testing

**Total**: 20+ integration tests covering all scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run listener tests only
npm test listener.test.ts

# Run with coverage
npm test -- --coverage listener.test.ts
```

---

## 🔌 API Contracts

### Backend Endpoints Required

**Get Listener Profile**:
```
GET /api/v1/listeners/{listenerId}
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "id": "listener-123",
  "user_id": "user-456",
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@peercove.com",
  "phone_number": "+1-555-0100",
  "specializations": ["Depression", "Anxiety"],
  "license_number": "LIC-12345",
  "years_of_experience": 8,
  "bio": "...",
  "profile_image_url": "https://...",
  "is_active": true,
  "verification_status": "verified",
  "created_at": "2023-01-15T10:00:00Z",
  "updated_at": "2024-11-11T10:00:00Z"
}
```

**Get Listener Stats**:
```
GET /api/v1/listeners/{listenerId}/stats
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "listener_id": "listener-123",
  "total_clients": 45,
  "active_clients": 32,
  "completed_sessions": 342,
  "total_session_hours": 285.5,
  "average_rating": 4.8,
  "total_reviews": 56,
  "response_time_minutes": 45,
  "available_slots": 8,
  "upcoming_appointments": 5,
  "cancellation_rate": 5.2,
  "created_at": "2024-11-01T00:00:00Z",
  "updated_at": "2024-11-11T10:00:00Z"
}
```

**Search Listeners**:
```
GET /api/v1/listeners/search?specialization=Depression&limit=20
Authorization: Bearer {JWT_TOKEN}

Response: Array of listener profiles
```

**Check Availability**:
```
GET /api/v1/listeners/{listenerId}/availability
Authorization: Bearer {JWT_TOKEN}

Response:
{ "available": true }
```

---

## 🚀 Integration Workflow

### 1. Component Usage

```typescript
// In a Next.js page or component
import { ListenerDashboard } from '@/modules/client/peercove/listener/presentation/components/ListenerDashboard';

export default function Page() {
  return (
    <ListenerDashboard
      listenerId="listener-123"
      onRefresh={() => console.log('Refreshed')}
    />
  );
}
```

### 2. Data Flow

```
1. User navigates to listener page
2. ListenerDashboard mounts
3. useListenerProfile and useListenerStats hooks execute
4. Hooks instantiate services and use cases
5. Use cases fetch from repository
6. Repository calls API endpoints with JWT
7. Response mapped to domain entities
8. Components render with data
9. User can refresh to refetch data
```

### 3. Error Handling

```typescript
// Errors are caught at every layer:
// Domain → Application → Infrastructure → Hooks → Components

// Components display user-friendly error messages:
"Failed to load listener profile"
"Network error occurred. Please try again."
"Your session has expired. Please log in again."
```

---

## 📊 Database Integration

### Required Database Schema

**listeners table**:
```sql
CREATE TABLE listeners (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  specializations TEXT[], -- JSON array
  license_number VARCHAR(50) NOT NULL UNIQUE,
  years_of_experience INTEGER NOT NULL,
  bio TEXT,
  profile_image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_listeners_email ON listeners(email);
CREATE INDEX idx_listeners_verification ON listeners(verification_status);
CREATE INDEX idx_listeners_active ON listeners(is_active);
```

**listener_stats table**:
```sql
CREATE TABLE listener_stats (
  id VARCHAR(50) PRIMARY KEY,
  listener_id VARCHAR(50) NOT NULL UNIQUE,
  total_clients INTEGER DEFAULT 0,
  active_clients INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  total_session_hours DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  response_time_minutes INTEGER DEFAULT 0,
  available_slots INTEGER DEFAULT 0,
  upcoming_appointments INTEGER DEFAULT 0,
  cancellation_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listener_id) REFERENCES listeners(id) ON DELETE CASCADE
);

CREATE INDEX idx_listener_stats_listener ON listener_stats(listener_id);
CREATE INDEX idx_listener_stats_rating ON listener_stats(average_rating);
```

---

## ✨ Best Practices

1. **Type Safety**: 100% TypeScript strict mode
2. **Immutability**: Domain entities use getters
3. **Error Handling**: Structured errors at every layer
4. **Testing**: Comprehensive test coverage (20+ tests)
5. **Performance**: Skeleton loading, concurrent fetching
6. **Security**: JWT token management, no credentials in code
7. **Separation**: Clear layer boundaries with unidirectional flow
8. **Validation**: Constructor-level validation prevents invalid states

---

## 🔗 Related Modules

- **Member Module**: Similar 4-layer architecture for member profiles
- **Better Auth**: JWT authentication at port 5001
- **FastAPI Backend**: REST API at port 8080
- **PostgreSQL**: Database at port 5433

---

## 📞 Support & Documentation

- See `README.md` for quick start
- See `listener.test.ts` for code examples
- See `listener.config.ts` for configuration options
- See individual component files for implementation details

---

**Created**: November 11, 2024  
**Architecture**: 4-Layer Clean Architecture  
**Language**: TypeScript  
**Framework**: React + Next.js  
**Status**: Production-Ready
