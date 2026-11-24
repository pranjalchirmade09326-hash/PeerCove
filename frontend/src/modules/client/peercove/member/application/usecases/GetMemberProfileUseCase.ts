/**
 * Get Member Profile Use Case - Application Layer
 *
 * Orchestrates retrieving member profile data.
 * Handles business logic and validation without UI concerns.
 *
 * Layer: Application
 */

import { IMemberService } from "../../domain/interfaces/IMemberService";
import { MemberProfile } from "../../domain/entities/MemberProfile";

export interface GetMemberProfileInput {
  userId: string;
}

export interface GetMemberProfileOutput {
  success: boolean;
  data?: MemberProfile;
  error?: string;
}

export class GetMemberProfileUseCase {
  constructor(private memberService: IMemberService) {
    if (!memberService) {
      throw new Error("GetMemberProfileUseCase: memberService is required");
    }
  }

  async execute(input: GetMemberProfileInput): Promise<GetMemberProfileOutput> {
    try {
      // Validate input
      if (!input.userId?.trim()) {
        return {
          success: false,
          error: "userId is required",
        };
      }

      // Fetch from service
      const profile = await this.memberService.getMemberProfile(input.userId);

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch member profile";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
