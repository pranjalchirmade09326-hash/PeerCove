from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.member import AppPrincipal, MemberProfile, MemberPreference, RoleAssignment, ConsentRecord
from app.schemas.member import MemberProfileUpdate, MemberPreferencesUpdate
from app.services.base import BaseService
from datetime import datetime
import uuid


class MemberService(BaseService):
    async def provision_me(self, user_id: str) -> dict:
        p_stmt = select(AppPrincipal).where(AppPrincipal.user_id == user_id)
        p_res = await self.db.execute(p_stmt)
        principal = p_res.scalar_one_or_none()
        if not principal:
            principal = AppPrincipal(user_id=user_id, account_state="active")
            self.db.add(principal)
            await self.db.commit()

        prof_stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
        prof_res = await self.db.execute(prof_stmt)
        profile = prof_res.scalar_one_or_none()
        if not profile:
            profile = MemberProfile(
                user_id=user_id,
                display_name=user_id.split("@")[0].title() if "@" in user_id else user_id.replace("usr-", "").replace("-", " ").title(),
                eligibility_state="eligible",
                profile_state="active"
            )
            self.db.add(profile)
            await self.db.commit()

        pref_stmt = select(MemberPreference).where(MemberPreference.user_id == user_id)
        pref_res = await self.db.execute(pref_stmt)
        pref = pref_res.scalar_one_or_none()
        if not pref:
            pref = MemberPreference(
                user_id=user_id,
                locale="en",
                timezone="UTC",
                preferred_languages=["en"],
                support_preferences={}
            )
            self.db.add(pref)
            await self.db.commit()

        return {
            "status": "provisioned",
            "userId": user_id,
            "displayName": profile.display_name if profile else user_id
        }

    async def get_me(self, user_id: str) -> dict:
        stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        
        roles_q = await self.db.execute(
            select(RoleAssignment.role_code).where(
                RoleAssignment.user_id == user_id,
                RoleAssignment.assignment_state == "active"
            )
        )
        roles = [r[0] for r in roles_q.fetchall()] or ["member"]

        display_name = profile.display_name if profile else (
            user_id.split("@")[0].title() if "@" in user_id else user_id.replace("usr-", "").replace("-", " ").title()
        )

        return {
            "userId": user_id,
            "displayName": display_name,
            "activeRoles": roles
        }

    async def get_profile(self, user_id: str) -> dict:
        stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        display_name = profile.display_name if profile else (user_id.split("@")[0].title() if "@" in user_id else user_id)
        if not profile:
            return {
                "userId": user_id,
                "displayName": display_name,
                "eligibilityState": "eligible",
                "profileState": "active"
            }
        return {
            "userId": profile.user_id,
            "displayName": profile.display_name,
            "eligibilityState": profile.eligibility_state,
            "profileState": profile.profile_state,
            "createdAt": profile.created_at.isoformat()
        }

    async def update_profile(self, user_id: str, payload: MemberProfileUpdate) -> dict:
        stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        if not profile:
            profile = MemberProfile(
                user_id=user_id,
                display_name=payload.display_name,
                eligibility_state="eligible",
                profile_state="active"
            )
            self.db.add(profile)
        else:
            profile.display_name = payload.display_name
            profile.updated_at = datetime.utcnow()
        
        await self.db.commit()
        return {"status": "success", "displayName": profile.display_name}

    async def get_preferences(self, user_id: str) -> dict:
        stmt = select(MemberPreference).where(MemberPreference.user_id == user_id)
        res = await self.db.execute(stmt)
        pref = res.scalar_one_or_none()
        if not pref:
            return {
                "locale": "en",
                "timezone": "UTC",
                "preferredLanguages": ["en"],
                "supportPreferences": {}
            }
        return {
            "locale": pref.locale,
            "timezone": pref.timezone,
            "preferredLanguages": pref.preferred_languages,
            "supportPreferences": pref.support_preferences
        }

    async def update_preferences(self, user_id: str, payload: MemberPreferencesUpdate) -> dict:
        stmt = select(MemberPreference).where(MemberPreference.user_id == user_id)
        res = await self.db.execute(stmt)
        pref = res.scalar_one_or_none()
        if not pref:
            pref = MemberPreference(
                user_id=user_id,
                locale=payload.locale or "en",
                timezone=payload.timezone or "UTC",
                preferred_languages=payload.preferred_languages or ["en"],
                support_preferences=payload.support_preferences or {}
            )
            self.db.add(pref)
        else:
            if payload.locale:
                pref.locale = payload.locale
            if payload.timezone:
                pref.timezone = payload.timezone
            if payload.preferred_languages:
                pref.preferred_languages = payload.preferred_languages
            if payload.support_preferences:
                pref.support_preferences = payload.support_preferences
            pref.updated_at = datetime.utcnow()

        await self.db.commit()
        return {"status": "success"}

    async def list_consents(self, user_id: str) -> list[dict]:
        stmt = select(ConsentRecord).where(ConsentRecord.user_id == user_id)
        res = await self.db.execute(stmt)
        consents = res.scalars().all()
        return [
            {
                "id": str(c.id),
                "purposeCode": c.purpose_code,
                "consentState": c.consent_state,
                "capturedAt": c.captured_at.isoformat()
            }
            for c in consents
        ]

    async def create_consent(self, user_id: str, payload: dict) -> dict:
        consent_id = str(uuid.uuid4())
        record = ConsentRecord(
            id=consent_id,
            user_id=user_id,
            purpose_code=payload.get("purposeCode", "intake"),
            recipient_user_id=payload.get("recipientUserId"),
            recipient_scope=payload.get("recipientScope", "peercove"),
            data_scope=payload.get("dataScope", {}),
            policy_version=payload.get("policyVersion", "v1"),
            consent_state=payload.get("consentState", "granted"),
            captured_by="member",
            captured_at=datetime.utcnow()
        )
        self.db.add(record)
        await self.db.commit()
        return {
            "id": consent_id,
            "purposeCode": record.purpose_code,
            "consentState": record.consent_state,
            "capturedAt": record.captured_at.isoformat()
        }

    async def list_notifications(self, user_id: str) -> list[dict]:
        return [
            {
                "id": "notif-1",
                "notificationType": "peer_session_reminder",
                "channel": "in_app",
                "deliveryState": "delivered",
                "scheduledAt": datetime.utcnow().isoformat(),
                "sentAt": datetime.utcnow().isoformat()
            }
        ]

    async def list_followups(self, user_id: str) -> list[dict]:
        return []


def get_member_service(db: AsyncSession = Depends(get_db)) -> MemberService:
    return MemberService(db)
