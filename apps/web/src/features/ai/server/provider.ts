import type {
  JobBuilderSuggestion,
  ProposalAssistantContext,
  ProposalAssistantSuggestion,
} from "../types";

export interface MarketplaceAiProvider {
  buildJob(description: string): Promise<JobBuilderSuggestion>;
  buildProposal(
    context: ProposalAssistantContext,
    emphasis?: string,
  ): Promise<ProposalAssistantSuggestion>;
}
