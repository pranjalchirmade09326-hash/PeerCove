from dataclasses import dataclass

DEMO_PASSWORD = "PeerCoveDemo123!"


@dataclass(frozen=True)
class DemoUser:
    id: str
    email: str
    name: str
    role: str


# Deterministic ids keep the development seed in sync with PeerCove API principals.
DEMO_USERS: list[DemoUser] = [
    DemoUser("usr-demo-member-01", "member@peercove.test", "Mira Sol", "member"),
    DemoUser("usr-demo-member-02", "member2@peercove.test", "Rohan Mehta", "member"),
    DemoUser("usr-demo-member-03", "member3@peercove.test", "Ananya Rao", "member"),
    DemoUser("usr-demo-listener-01", "listener@peercove.test", "Jordan Lee", "listener"),
    DemoUser("usr-demo-listener-02", "listener2@peercove.test", "Sam Rivera", "listener"),
    DemoUser("usr-demo-listener-03", "listener3@peercove.test", "Priya Nair", "listener"),
    DemoUser("usr-demo-listener-04", "listener4@peercove.test", "Alex Chen", "listener"),
    DemoUser("usr-demo-supervisor-01", "supervisor@peercove.test", "Rae Kim", "listener_supervisor"),
    DemoUser("usr-demo-safety-01", "safety@peercove.test", "Noor Haddad", "safety_operations_specialist"),
    DemoUser("usr-demo-admin-01", "admin@peercove.test", "Ada Okafor", "platform_administrator"),
    DemoUser("usr-demo-agent-01", "agent@peercove.test", "Wellbeing Guide Agent", "ai_agent_service"),
]

DEMO_USER_IDS: dict[str, str] = {u.email: u.id for u in DEMO_USERS}
