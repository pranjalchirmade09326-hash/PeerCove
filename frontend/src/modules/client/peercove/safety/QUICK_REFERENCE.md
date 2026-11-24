# Safety Module - Quick Reference Guide

## 📍 Location
```
D:\PeerCove\frontend\src\modules\client\peercove\safety\
```

## 📋 21 Files Created

### Domain (3 files)
- `domain/entities/SafetyProfile.ts` - User safety profile entity
- `domain/entities/SafetyStats.ts` - Safety statistics entity  
- `domain/interfaces/ISafetyService.ts` - Service interface

### Application (3 files)
- `application/usecases/GetSafetyProfileUseCase.ts` - Fetch profile
- `application/usecases/GetSafetyStatsUseCase.ts` - Fetch stats
- `application/dto/index.ts` - DTOs and Result<T> pattern

### Infrastructure (2 files)
- `infrastructure/repositories/SafetyRepository.ts` - API client
- `infrastructure/services/SafetyServiceImpl.ts` - Service implementation

### Presentation (6 files)
- `presentation/components/SafetyDashboard.tsx` - Main dashboard
- `presentation/components/SafetyProfileHeader.tsx` - Profile header
- `presentation/components/SafetyStatsGrid.tsx` - Stats grid (8 cards)
- `presentation/components/AlertsTable.tsx` - Alerts display
- `presentation/hooks/useSafetyProfile.ts` - Profile hook
- `presentation/hooks/useSafetyStats.ts` - Stats hook

### Configuration & Testing (3 files)
- `config/safety.config.ts` - Configuration with helpers
- `safety.test.ts` - 20+ unit tests
- `BUILD_MANIFEST.md` - This file manifest

### Documentation (3 files)
- `README.md` - User guide (9KB+)
- `ARCHITECTURE.md` - Technical architecture (17KB+)
- `BUILD_MANIFEST.md` - Build manifest

## 🚀 Quick Start

### 1. Import Component
```tsx
import { SafetyDashboard } from '@/modules/client/peercove/safety/presentation/components';

export default function SafetyPage() {
  return <SafetyDashboard profileId="user-123" />;
}
```

### 2. Use Hooks
```tsx
import { useSafetyProfile } from '@/modules/client/peercove/safety/presentation/hooks/useSafetyProfile';
import { useSafetyStats } from '@/modules/client/peercove/safety/presentation/hooks/useSafetyStats';

function MyComponent() {
  const { profile, loading } = useSafetyProfile('profile-123');
  const { stats } = useSafetyStats('safety-123');
  
  return <div>{profile?.first_name}</div>;
}
```

### 3. Use Services
```tsx
import { SafetyRepository } from '@/modules/client/peercove/safety/infrastructure/repositories/SafetyRepository';
import { SafetyServiceImpl } from '@/modules/client/peercove/safety/infrastructure/services/SafetyServiceImpl';

const repo = new SafetyRepository();
const service = new SafetyServiceImpl(repo);
const profile = await service.getSafetyProfile('id');
```

## ⚙️ Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
SAFETY_CACHE_ENABLED=true
SAFETY_CACHE_DURATION=300000
SAFETY_ENABLE_POLLING=true
SAFETY_DEFAULT_LIMIT=20
SAFETY_REFRESH_INTERVAL=30000
```

### Config Helpers
```typescript
import { 
  getRiskLevel, 
  getRiskColor, 
  getResponseTimeStatus,
  validateRiskScore 
} from '@/modules/client/peercove/safety/config/safety.config';

const level = getRiskLevel(75);        // 'high'
const color = getRiskColor('high');    // '#EF4444'
const status = getResponseTimeStatus(45); // 'acceptable'
```

## 🎯 Risk Levels

| Level | Score | Color | Action |
|-------|-------|-------|--------|
| Low | 0-39 | Green (#10B981) | Monitor |
| Medium | 40-59 | Amber (#F59E0B) | Review |
| High | 60-79 | Red (#EF4444) | Follow-up |
| Critical | 80-100 | Dark Red (#991B1B) | Immediate |

## 📊 Component Props

### SafetyDashboard
```typescript
<SafetyDashboard
  profileId="string"                          // Required
  onError={(error) => void}                  // Optional
  autoRefreshInterval={30000}                // Optional, default 30000ms
/>
```

### SafetyProfileHeader
```typescript
<SafetyProfileHeader
  firstName="John"
  lastName="Doe"
  email="john@example.com"
  phone="123-456-7890"                       // Optional
  riskScore={65}                             // 0-100
  status="high"                              // low/medium/high/critical
  needsIntervention={true}
  isActive={true}
/>
```

### SafetyStatsGrid
```typescript
<SafetyStatsGrid
  highRiskUsers={5}
  alertsActive={3}
  incidentsReported={2}
  avgResponseTimeMinutes={45}
  escalationsMade={1}
  assessmentCompletionRate={85}              // 0-100
  criticalCases={1}
  healthScore={78}                           // 0-100
  systemStatus="healthy"                     // healthy/warning/critical
/>
```

### AlertsTable
```typescript
<AlertsTable
  alerts={[...]}                             // SafetyAlert[]
  loading={false}                            // Optional
  onAcknowledge={(alertId) => void}         // Optional
  onEscalate={(alertId) => void}            // Optional
/>
```

## 🧪 Testing

Run all tests:
```bash
npm test -- safety.test.ts
```

Test categories:
- Domain entities (SafetyProfile, SafetyStats)
- Use cases (GetSafetyProfileUseCase, GetSafetyStatsUseCase)
- Configuration helpers
- Validation functions

## 📚 Data Models

### SafetyProfile
```typescript
{
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  risk_score: number;              // 0-100
  status: 'low' | 'medium' | 'high' | 'critical';
  last_assessment_date: Date;
  needs_intervention: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### SafetyStats
```typescript
{
  safety_id: string;
  high_risk_users: number;
  alerts_active: number;
  incidents_reported: number;
  avg_response_time_minutes: number;
  escalations_made: number;
  assessment_completion_rate: number;        // 0-100
  critical_cases: number;
  created_at: Date;
  updated_at: Date;
}
```

## 🔌 API Endpoints

```
GET    /api/v1/safety/profiles/:id
GET    /api/v1/safety/profiles/search
GET    /api/v1/safety/profiles/high-risk
GET    /api/v1/safety/profiles/critical
GET    /api/v1/safety/stats/:id
GET    /api/v1/safety/stats/aggregated
GET    /api/v1/safety/alerts/active
POST   /api/v1/safety/alerts/:id/acknowledge
POST   /api/v1/safety/alerts/:id/escalate
GET    /api/v1/safety/assessments/recent
POST   /api/v1/safety/assessments
```

## 🔐 Authentication

Bearer token in Authorization header:
```typescript
const token = 'jwt-token-here';
repository.setAuthToken(token);
```

## ⚡ Performance

- **Caching**: 5 minutes (configurable)
- **Timeout**: 30 seconds
- **Retries**: 3 with exponential backoff
- **Auto-refresh**: 30 seconds (configurable)
- **Pagination**: 20 items (default), 100 max

## 🎨 Styling

All components use Tailwind CSS. Customize by:
1. Override colors in tailwind.config.js
2. Modify component className strings
3. Use config helpers for dynamic colors

## 📖 Documentation Files

- **README.md** - Complete user guide (9KB+)
  - Overview, features, architecture
  - Data models, API endpoints
  - Component & hook documentation
  - Usage examples, configuration
  - Testing, error handling, security

- **ARCHITECTURE.md** - Technical deep-dive (17KB+)
  - Layer-by-layer design
  - Data flow, design patterns
  - Error handling strategy
  - Performance optimization
  - Scalability & maintainability

## ✅ Checklist

- [ ] Read README.md
- [ ] Read ARCHITECTURE.md  
- [ ] Run `npm test -- safety.test.ts`
- [ ] Configure environment variables
- [ ] Set API endpoints
- [ ] Import SafetyDashboard
- [ ] Test with real data
- [ ] Configure error handling
- [ ] Set up monitoring
- [ ] Deploy to production

## 🆘 Common Issues

**Q: Type errors when importing?**
A: Ensure tsconfig.json path aliases are configured.

**Q: API calls failing?**
A: Check environment variables and JWT token.

**Q: Components not rendering?**
A: Verify data is passed correctly to props.

**Q: Tests failing?**
A: Ensure jest is installed and configured.

**Q: Styling looks wrong?**
A: Verify Tailwind CSS is installed and configured.

## 🎓 Learning Path

1. Start with README.md for overview
2. Review ARCHITECTURE.md for patterns
3. Examine test cases for examples
4. Review component code and comments
5. Try using hooks in your components
6. Customize for your needs

---

**Status**: ✅ Production Ready  
**Last Updated**: January 15, 2024  
**Version**: 1.0.0
