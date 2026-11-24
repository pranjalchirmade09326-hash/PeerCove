/**
 * useMemberProfile Hook - Presentation Layer
 *
 * React hook for fetching and managing member profile data.
 * Bridges domain logic with React components.
 *
 * Layer: Presentation
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { MemberProfile } from "../domain/entities/MemberProfile";
import { GetMemberProfileUseCase } from "../application/usecases/GetMemberProfileUseCase";
import { MemberServiceImpl } from "../infrastructure/services/MemberServiceImpl";

interface UseMemberProfileState {
  profile: MemberProfile | null;
  loading: boolean;
  error: string | null;
}

interface UseMemberProfileResult extends UseMemberProfileState {
  refetch: () => Promise<void>;
}

export function useMemberProfile(userId: string | null): UseMemberProfileResult {
  const [state, setState] = useState<UseMemberProfileState>({
    profile: null,
    loading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setState({
        profile: null,
        loading: false,
        error: "User ID is required",
      });
      return;
    }

    try {
      setState({ profile: null, loading: true, error: null });

      const service = new MemberServiceImpl();
      const useCase = new GetMemberProfileUseCase(service);

      const result = await useCase.execute({ userId });

      if (result.success && result.data) {
        setState({
          profile: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          profile: null,
          loading: false,
          error: result.error || "Failed to fetch profile",
        });
      }
    } catch (error) {
      setState({
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    ...state,
    refetch: fetchProfile,
  };
}
