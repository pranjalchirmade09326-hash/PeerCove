/**
 * SAFETY MODULE - README
 * 
 * Comprehensive safety monitoring and risk assessment module for PeerCove platform.
 * Provides real-time safety tracking, risk scoring, and incident management.
 * 
 * @version 1.0.0
 * @module safety
 */

# Safety Module - Complete Guide

## Overview

The Safety Module is a comprehensive system for monitoring user safety, tracking risk assessments, managing incidents, and coordinating emergency responses. It follows a 4-layer clean architecture pattern (Domain, Application, Infrastructure, Presentation) with full type safety and comprehensive error handling.

### Key Features

- **Risk Scoring System**: 0-100 scale with 4 severity levels (low/medium/high/critical)
- **Real-time Alerts**: Active alert monitoring with color-coded severity levels
- **Incident Tracking**: Complete incident history and trend analysis
- **Response Time Monitoring**: Track and optimize safety team response times
- **Assessment Management**: Schedule and track safety assessments
- **Escalation Workflow**: Automated escalation for critical cases
- **Dashboard**: Comprehensive visual monitoring dashboard

## Architecture

### 4-Layer Clean Architecture

```
┌─────────────────────────────────────────┐
│      PRESENTATION LAYER                 │
│  (Components, Hooks, UI State)         │
├─────────────────────────────────────────┤
│      APPLICATION LAYER                  │
│  (Use Cases, DTOs, Business Logic)     │
├─────────────────────────────────────────┤
│      INFRASTRUCTURE LAYER               │
│  (Repository, API Client, Services)    │
├─────────────────────────────────────────┤
│      DOMAIN LAYER                       │
│  (Entities, Interfaces, Rules)         │
└─────────────────────────────────────────┘
```

### Layer Responsibilities

#### Domain Layer (`domain/`)
- **Entities**: SafetyProfile, SafetyStats
- **Interfaces**: ISafetyService contract
- Framework-independent business logic
- Data validation and entity rules

#### Application Layer (`application/`)
- **Use Cases**: GetSafetyProfileUseCase, GetSafetyStatsUseCase
- **DTOs**: Data transfer objects with Result<T> pattern
- Orchestrates domain and infrastructure
- Input validation and error handling

#### Infrastructure Layer (`infrastructure/`)
- **Repository**: SafetyRepository with API communication
- **Service**: SafetyServiceImpl implementing ISafetyService
- JWT authentication and retry logic
- API endpoint mapping

#### Presentation Layer (`presentation/`)
- **Components**: SafetyDashboard, SafetyProfileHeader, SafetyStatsGrid, AlertsTable
- **Hooks**: useSafetyProfile, useSafetyStats
- React components with Tailwind CSS
- State management and side effects

## Data Models

### SafetyProfile Entity

Core user safety profile with assessment data.

```typescript
{
  id: string;                        // Unique profile ID
  user_id: string;                   // Associated user ID
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  risk_score: number;                // 0-100 scale
  status: 'low' | 'medium' | 'high' | 'critical';
  last_assessment_date: Date;        // Most recent assessment
  needs_intervention: boolean;       // Requires immediate action
  is_active: boolean;                // Profile status
  created_at: Date;
  updated_at: Date;
}
```

### SafetyStats Entity

Aggregated safety metrics and monitoring statistics.

```typescript
{
  safety_id: string;                    // Reference to safety system
  high_risk_users: number;              // Count of high-risk profiles
  alerts_active: number;                // Currently active alerts
  incidents_reported: number;           // Total incidents
  avg_response_time_minutes: number;    // Average response time
  escalations_made: number;             // Total escalations
  assessment_completion_rate: number;   // Percentage (0-100)
  critical_cases: number;               // Number of critical cases
  created_at: Date;
  updated_at: Date;
}
```

## Risk Scoring

### Risk Levels

| Level    | Score Range | Color  | Action Required |
|----------|-------------|--------|-----------------|
| Low      | 0-39        | Green  | Monitor         |
| Medium   | 40-59       | Amber  | Review          |
| High     | 60-79       | Red    | Follow-up       |
| Critical | 80-100      | Dark   | Immediate       |

### Risk Score Calculation

Risk scores are calculated based on:
- Historical incident patterns
- Assessment notes and observations
- Recent behavioral indicators
- Professional judgment factors
- System-generated risk factors

## API Endpoints

### Profile Endpoints

```
GET    /api/v1/safety/profiles/:id              Get profile by ID
GET    /api/v1/safety/profiles/search           Search profiles
GET    /api/v1/safety/profiles/high-risk        Get high-risk profiles
GET    /api/v1/safety/profiles/critical         Get critical profiles
POST   /api/v1/safety/profiles/:id/assessment   Update assessment
```

### Stats Endpoints

```
GET    /api/v1/safety/stats/:id                 Get stats by ID
GET    /api/v1/safety/stats/aggregated          Get system-wide stats
```

### Alert Endpoints

```
GET    /api/v1/safety/alerts/active             Get active alerts
POST   /api/v1/safety/alerts/:id/acknowledge    Acknowledge alert
POST   /api/v1/safety/alerts/:id/escalate       Escalate alert
```

### Assessment Endpoints

```
GET    /api/v1/safety/assessments/recent        Get recent assessments
POST   /api/v1/safety/assessments                Create assessment
```

## Components

### SafetyDashboard
Main orchestrator component that coordinates all sub-components.

**Features:**
- Profile header with risk indicators
- Stats grid with health scoring
- Active alerts table
- Auto-refresh capability
- Error handling

**Props:**
```typescript
{
  profileId: string;
  onError?: (error: string) => void;
  autoRefreshInterval?: number;  // Default: 30000ms
}
```

### SafetyProfileHeader
Displays user profile with risk visualization.

**Features:**
- User initials avatar (color-coded)
- Risk score with progress bar
- Status indicators
- Intervention requirements
- Severity visualization

### SafetyStatsGrid
Shows 8 key statistics with color-coded alerts.

**Stats Displayed:**
1. High Risk Users
2. Active Alerts
3. Incidents Reported
4. Avg Response Time
5. Escalations Made
6. Assessment Completion Rate
7. Critical Cases
8. Total Urgent Cases

**Health Overview:**
- Overall health score (0-100)
- System status (healthy/warning/critical)

### AlertsTable
Displays active alerts with severity color-coding.

**Features:**
- Alert type and message
- Severity indicators
- Acknowledgment status
- Created timestamp
- Action buttons (Acknowledge, Escalate)

## Hooks

### useSafetyProfile
Manages safety profile data and loading state.

```typescript
const { profile, loading, error, refetch } = useSafetyProfile(profileId);
```

**Returns:**
- `profile`: SafetyProfileOutput or null
- `loading`: Boolean
- `error`: Error message or null
- `refetch`: Function to manually refresh

### useSafetyStats
Manages safety statistics and loading state.

```typescript
const { stats, loading, error, refetch } = useSafetyStats(safetyId);
```

**Returns:**
- `stats`: SafetyStatsOutput or null
- `loading`: Boolean
- `error`: Error message or null
- `refetch`: Function to manually refresh

## Configuration

The `safety.config.ts` file provides centralized configuration:

```typescript
safetyConfig = {
  api: { baseUrl, endpoints, timeout, retries },
  cache: { enabled, duration },
  riskThresholds: { low, medium, high, critical },
  features: { enablePolling, enableWebsocket, enableRealTimeStats },
  pagination: { defaultLimit, maxLimit },
  responseTimeThresholds: { excellent, good, acceptable, slow },
  ui: { showRiskScore, showAlerts, showStats, theme },
  validation: { minRiskScore, maxRiskScore, requireAssessmentEvery },
  alerts: { severityColors, autoEscalateAfter, maxAlertsDisplay },
  messages: { ... }
}
```

### Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Safety-specific
SAFETY_CACHE_ENABLED=true
SAFETY_CACHE_DURATION=300000
SAFETY_ENABLE_POLLING=true
SAFETY_ENABLE_WEBSOCKET=false
SAFETY_ENABLE_REALTIME_STATS=true
SAFETY_DEFAULT_LIMIT=20
SAFETY_THEME=light
SAFETY_REFRESH_INTERVAL=30000
```

## Usage Examples

### Basic Dashboard Setup

```tsx
import { SafetyDashboard } from '@/modules/client/peercove/safety/presentation/components/SafetyDashboard';

export default function SafetyPage() {
  return (
    <SafetyDashboard
      profileId="user-123"
      autoRefreshInterval={30000}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Using Hooks Directly

```tsx
import { useSafetyProfile } from '@/modules/client/peercove/safety/presentation/hooks/useSafetyProfile';
import { useSafetyStats } from '@/modules/client/peercove/safety/presentation/hooks/useSafetyStats';

export function MyComponent() {
  const { profile, loading: profileLoading } = useSafetyProfile('profile-123');
  const { stats, loading: statsLoading } = useSafetyStats('safety-123');

  if (profileLoading || statsLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile?.first_name} {profile?.last_name}</h1>
      <p>Risk Score: {profile?.risk_score}</p>
      <p>Active Alerts: {stats?.alerts_active}</p>
    </div>
  );
}
```

### Using Services Directly

```tsx
import { SafetyRepository } from '@/modules/client/peercove/safety/infrastructure/repositories/SafetyRepository';
import { SafetyServiceImpl } from '@/modules/client/peercove/safety/infrastructure/services/SafetyServiceImpl';

async function fetchSafetyData() {
  const repository = new SafetyRepository();
  repository.setAuthToken('your-jwt-token');

  const service = new SafetyServiceImpl(repository);

  // Get profile
  const profile = await service.getSafetyProfile('profile-123');

  // Get high-risk profiles
  const highRisk = await service.getHighRiskProfiles(20);

  // Get active alerts
  const alerts = await service.getActiveAlerts(50);
}
```

## Testing

The module includes 20+ comprehensive tests covering:

- **Domain Entities**: Validation, business logic, calculations
- **Use Cases**: Input validation, error handling
- **Configuration**: Validation helpers, utility functions
- **DTOs**: Type safety, data mapping

Run tests with:
```bash
npm test -- safety.test.ts
```

## Error Handling

The module implements comprehensive error handling:

1. **Domain Validation**: Entities validate input in constructor
2. **Use Case Error Handling**: Try-catch with Result<T> pattern
3. **API Error Handling**: Retry logic with exponential backoff
4. **Component Error Handling**: Error boundaries and error states
5. **User-Friendly Messages**: Configured in safety.config.ts

### Error Response Pattern

```typescript
{
  success: false,
  error: "Error message",
  metadata: {
    timestamp: "2024-01-15T10:30:00Z",
    duration: 145
  }
}
```

## Performance Considerations

- **Caching**: Configurable cache with 5-minute default TTL
- **Pagination**: Default 20 items, max 100 items per request
- **Retry Logic**: 3 retries with exponential backoff
- **API Timeout**: 30-second timeout per request
- **Auto-Refresh**: 30-second default refresh interval

## Security

- **JWT Authentication**: Token-based API authentication
- **Authorization**: Role-based access control (via API)
- **Data Validation**: Input validation at domain layer
- **Email Verification**: Email format validation
- **Secure Requests**: HTTPS enforced in production

## Responsive Design

All components are fully responsive:
- **Mobile**: 100% width, touch-friendly
- **Tablet**: 2-column layout for stats grid
- **Desktop**: 4-column layout for stats grid
- **Large Screens**: Full featured experience

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Future Enhancements

- Real-time WebSocket updates
- Advanced analytics and reporting
- Custom risk scoring algorithms
- Integration with external crisis services
- Mobile native app
- Advanced filtering and search
- Bulk operations
- Audit logging

## Support & Contributing

For issues or contributions, refer to the main PeerCove project guidelines.

---

**Module Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: Production Ready  
**Maintenance**: Active
