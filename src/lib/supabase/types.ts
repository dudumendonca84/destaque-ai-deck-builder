export type ProspectStatus =
  | "lead"
  | "contacted"
  | "opened"
  | "replied"
  | "scheduled"
  | "won"
  | "lost";

export type ProposalStatus = "draft" | "sent" | "viewed" | "replied" | "expired";

export type AuditStatus = "pending" | "running" | "completed" | "failed";

export type AuditTier = "free" | "diagnostic" | "premium";

export type Engine = "chatgpt" | "claude" | "gemini" | "grok" | "deepseek" | "mistral";

export type IntentStage =
  | "awareness"
  | "research"
  | "comparison"
  | "decision"
  | "post_decision";

export type PromptCategory =
  | "generic_category"
  | "direct_comparison"
  | "local_recommendation"
  | "feature_specific"
  | "price_comparison";

export type GeneratedPromptMeta = {
  text: string;
  category: PromptCategory;
  intent_stage: IntentStage;
};

export type AuditEngineSummary = {
  citation_rate: number;
  share_of_voice: number;
  avg_position: number | null;
  top_competitors: string[];
};

export type AuditResults = {
  summary: AuditEngineSummary;
  by_engine: Record<Engine, AuditEngineSummary>;
};

// Shape inspirada nos tipos gerados pelo `supabase gen types typescript`.
export type Database = {
  public: {
    Tables: {
      prospects: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          company_name: string;
          company_website: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_role: string | null;
          linkedin_url: string | null;
          business_type: string | null;
          location: string | null;
          target_audience: string | null;
          competitors: string[] | null;
          notes: string | null;
          source: string | null;
          status: ProspectStatus;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_name: string;
          company_website?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_role?: string | null;
          linkedin_url?: string | null;
          business_type?: string | null;
          location?: string | null;
          target_audience?: string | null;
          competitors?: string[] | null;
          notes?: string | null;
          source?: string | null;
          status?: ProspectStatus;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_name?: string;
          company_website?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_role?: string | null;
          linkedin_url?: string | null;
          business_type?: string | null;
          location?: string | null;
          target_audience?: string | null;
          competitors?: string[] | null;
          notes?: string | null;
          source?: string | null;
          status?: ProspectStatus;
        };
        Relationships: [];
      };
      proposals: {
        Row: {
          id: string;
          prospect_id: string;
          created_at: string;
          updated_at: string;
          token: string;
          custom_prompts: string[];
          custom_message: string | null;
          pricing_diagnostico: number | null;
          pricing_sprint: number | null;
          pricing_retainer: number | null;
          audit_status: AuditStatus;
          audit_tier: AuditTier;
          prompts_meta: GeneratedPromptMeta[] | null;
          audit_started_at: string | null;
          audit_completed_at: string | null;
          audit_results: AuditResults | null;
          deck_blocks: unknown | null;
          deck_synthesized_at: string | null;
          deck_synthesized_source: "claude" | "fallback" | null;
          status: ProposalStatus;
          sent_at: string | null;
          expires_at: string | null;
          first_viewed_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          created_at?: string;
          updated_at?: string;
          token: string;
          custom_prompts: string[];
          custom_message?: string | null;
          pricing_diagnostico?: number | null;
          pricing_sprint?: number | null;
          pricing_retainer?: number | null;
          audit_status?: AuditStatus;
          audit_tier?: AuditTier;
          prompts_meta?: GeneratedPromptMeta[] | null;
          audit_started_at?: string | null;
          audit_completed_at?: string | null;
          audit_results?: AuditResults | null;
          status?: ProposalStatus;
          sent_at?: string | null;
          expires_at?: string | null;
          first_viewed_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          prospect_id?: string;
          created_at?: string;
          updated_at?: string;
          token?: string;
          custom_prompts?: string[];
          custom_message?: string | null;
          pricing_diagnostico?: number | null;
          pricing_sprint?: number | null;
          pricing_retainer?: number | null;
          audit_status?: AuditStatus;
          audit_tier?: AuditTier;
          prompts_meta?: GeneratedPromptMeta[] | null;
          audit_started_at?: string | null;
          audit_completed_at?: string | null;
          audit_results?: AuditResults | null;
          status?: ProposalStatus;
          sent_at?: string | null;
          expires_at?: string | null;
          first_viewed_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposals_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
      proposal_events: {
        Row: {
          id: string;
          proposal_id: string;
          created_at: string;
          event_type: string;
          slide_number: number | null;
          slide_id: string | null;
          duration_seconds: number | null;
          user_agent: string | null;
          ip_country: string | null;
          referrer: string | null;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          created_at?: string;
          event_type: string;
          slide_number?: number | null;
          slide_id?: string | null;
          duration_seconds?: number | null;
          user_agent?: string | null;
          ip_country?: string | null;
          referrer?: string | null;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          proposal_id?: string;
          created_at?: string;
          event_type?: string;
          slide_number?: number | null;
          slide_id?: string | null;
          duration_seconds?: number | null;
          user_agent?: string | null;
          ip_country?: string | null;
          referrer?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposal_events_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_runs: {
        Row: {
          id: string;
          proposal_id: string;
          created_at: string;
          prompt: string;
          engine: Engine;
          intent_stage: IntentStage | null;
          response: string | null;
          citations_found: string[] | null;
          brand_position: number | null;
          brand_present: boolean;
          competitors_mentioned: string[] | null;
          sentiment_score: number | null;
          tokens_used: number | null;
          cost_usd: number | null;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          created_at?: string;
          prompt: string;
          engine: Engine;
          intent_stage?: IntentStage | null;
          response?: string | null;
          citations_found?: string[] | null;
          brand_position?: number | null;
          brand_present?: boolean;
          competitors_mentioned?: string[] | null;
          sentiment_score?: number | null;
          tokens_used?: number | null;
          cost_usd?: number | null;
        };
        Update: {
          id?: string;
          proposal_id?: string;
          created_at?: string;
          prompt?: string;
          engine?: Engine;
          intent_stage?: IntentStage | null;
          response?: string | null;
          citations_found?: string[] | null;
          brand_position?: number | null;
          brand_present?: boolean;
          competitors_mentioned?: string[] | null;
          sentiment_score?: number | null;
          tokens_used?: number | null;
          cost_usd?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_runs_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Prospect = Database["public"]["Tables"]["prospects"]["Row"];
export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type ProposalEvent = Database["public"]["Tables"]["proposal_events"]["Row"];
export type AuditRun = Database["public"]["Tables"]["audit_runs"]["Row"];
