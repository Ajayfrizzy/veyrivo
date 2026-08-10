CREATE TYPE "public"."account_status" AS ENUM('PENDING_EMAIL_VERIFICATION', 'ACTIVE', 'RESTRICTED', 'SECURITY_REVIEW', 'SUSPENDED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."agreement_status" AS ENUM('DRAFT', 'INVITED', 'AWAITING_FUNDING', 'FUNDED_AWAITING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'EXPIRED', 'CANCELLATION_PENDING', 'CANCELLED', 'DISPUTED', 'SECURITY_HOLD', 'REFUND_PENDING', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('OPEN', 'EVIDENCE_COLLECTION', 'UNDER_REVIEW', 'RESOLVED', 'APPEALED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."identity_status" AS ENUM('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED', 'REVIEW_REQUIRED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('PENDING', 'ACTIVE', 'PROOF_SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'RELEASE_PENDING', 'RELEASED', 'DISPUTED', 'SECURITY_HOLD', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."operation_status" AS ENUM('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'SECURITY_HOLD', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."wallet_purpose" AS ENUM('FUNDING', 'PAYOUT', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."wallet_status" AS ENUM('PENDING', 'VERIFIED', 'REPLACED', 'LOCKED', 'REVOKED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100),
	"correlation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"decided_by" uuid NOT NULL,
	"approved_by" uuid,
	"worker_share_bps" integer NOT NULL,
	"client_refund_bps" integer NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispute_split_complete" CHECK ("dispute_decisions"."worker_share_bps" >= 0 AND "dispute_decisions"."client_refund_bps" >= 0 AND "dispute_decisions"."worker_share_bps" + "dispute_decisions"."client_refund_bps" = 10000)
);
--> statement-breakpoint
CREATE TABLE "dispute_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"note" text NOT NULL,
	"file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(30) NOT NULL,
	"job_id" uuid NOT NULL,
	"milestone_id" uuid,
	"opened_by" uuid NOT NULL,
	"reason_code" varchar(60) NOT NULL,
	"description" text NOT NULL,
	"status" "dispute_status" DEFAULT 'OPEN' NOT NULL,
	"evidence_due_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset" varchar(30) NOT NULL,
	"subtotal" bigint NOT NULL,
	"client_fee" bigint NOT NULL,
	"worker_fee" bigint NOT NULL,
	"network_reserve" bigint NOT NULL,
	"total_funding" bigint NOT NULL,
	"worker_net" bigint NOT NULL,
	"policy_version" varchar(30) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_reference" varchar(160),
	"status" "identity_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"country_code" varchar(2),
	"risk_level" varchar(20),
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_payout_destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"worker_user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"network" varchar(30) NOT NULL,
	"address" varchar(300) NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(30) NOT NULL,
	"client_user_id" uuid NOT NULL,
	"worker_user_id" uuid,
	"worker_email" varchar(320) NOT NULL,
	"title" varchar(90) NOT NULL,
	"description" text NOT NULL,
	"asset" varchar(30) DEFAULT 'CKB' NOT NULL,
	"asset_decimals" integer DEFAULT 8 NOT NULL,
	"subtotal" bigint NOT NULL,
	"client_fee" bigint NOT NULL,
	"worker_fee_bps" integer DEFAULT 200 NOT NULL,
	"network_reserve" bigint NOT NULL,
	"status" "agreement_status" DEFAULT 'DRAFT' NOT NULL,
	"acceptance_expires_at" timestamp with time zone,
	"funded_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"external_agreement_id" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_amounts_nonnegative" CHECK ("jobs"."subtotal" >= 0 AND "jobs"."client_fee" >= 0 AND "jobs"."network_reserve" >= 0),
	CONSTRAINT "jobs_worker_fee_valid" CHECK ("jobs"."worker_fee_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"evidence_requirements" text NOT NULL,
	"status" "milestone_status" DEFAULT 'PENDING' NOT NULL,
	"review_period_days" integer DEFAULT 5 NOT NULL,
	"revision_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestone_amount_positive" CHECK ("milestones"."amount" > 0),
	CONSTRAINT "milestone_review_days_valid" CHECK ("milestones"."review_period_days" BETWEEN 1 AND 30)
);
--> statement-breakpoint
CREATE TABLE "operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"milestone_id" uuid,
	"initiated_by" uuid,
	"type" varchar(40) NOT NULL,
	"idempotency_key" varchar(120) NOT NULL,
	"amount" bigint,
	"asset" varchar(30),
	"status" "operation_status" DEFAULT 'PENDING' NOT NULL,
	"external_reference" varchar(160),
	"error_code" varchar(80),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"headline" varchar(160),
	"bio" text,
	"country_code" varchar(2),
	"timezone" varchar(80) DEFAULT 'Africa/Lagos' NOT NULL,
	"avatar_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proof_submission_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"content_type" varchar(120) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"scan_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proof_file_size_valid" CHECK ("proof_files"."size_bytes" > 0 AND "proof_files"."size_bytes" <= 26214400)
);
--> statement-breakpoint
CREATE TABLE "proof_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_id" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"version" integer NOT NULL,
	"note" text NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review_deadline" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_id" uuid NOT NULL,
	"proof_submission_id" uuid NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"decision" varchar(30) NOT NULL,
	"reason" text,
	"automatic" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revision_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_id" uuid NOT NULL,
	"proof_submission_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"response_due_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"type" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"released_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"user_agent" text,
	"ip_hash" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text,
	"email_verified_at" timestamp with time zone,
	"status" "account_status" DEFAULT 'PENDING_EMAIL_VERIFICATION' NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"network" varchar(30) NOT NULL,
	"address" varchar(300) NOT NULL,
	"nonce_hash" varchar(64) NOT NULL,
	"message" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"network" varchar(30) NOT NULL,
	"address" varchar(300) NOT NULL,
	"purpose" "wallet_purpose" NOT NULL,
	"status" "wallet_status" DEFAULT 'PENDING' NOT NULL,
	"is_default_funding" boolean DEFAULT false NOT NULL,
	"is_default_payout" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"replaced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_decisions" ADD CONSTRAINT "dispute_decisions_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_decisions" ADD CONSTRAINT "dispute_decisions_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_decisions" ADD CONSTRAINT "dispute_decisions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_file_id_proof_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."proof_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_quotes" ADD CONSTRAINT "fee_quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_payout_destinations" ADD CONSTRAINT "job_payout_destinations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_payout_destinations" ADD CONSTRAINT "job_payout_destinations_worker_user_id_users_id_fk" FOREIGN KEY ("worker_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_payout_destinations" ADD CONSTRAINT "job_payout_destinations_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_worker_user_id_users_id_fk" FOREIGN KEY ("worker_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_files" ADD CONSTRAINT "proof_files_proof_submission_id_proof_submissions_id_fk" FOREIGN KEY ("proof_submission_id") REFERENCES "public"."proof_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_submissions" ADD CONSTRAINT "proof_submissions_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_submissions" ADD CONSTRAINT "proof_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_proof_submission_id_proof_submissions_id_fk" FOREIGN KEY ("proof_submission_id") REFERENCES "public"."proof_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_proof_submission_id_proof_submissions_id_fk" FOREIGN KEY ("proof_submission_id") REFERENCES "public"."proof_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_holds" ADD CONSTRAINT "security_holds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_holds" ADD CONSTRAINT "security_holds_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_challenges" ADD CONSTRAINT "wallet_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "disputes_reference_unique" ON "disputes" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "disputes_job_idx" ON "disputes" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "identity_user_idx" ON "identity_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_payout_destination_unique" ON "job_payout_destinations" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_reference_unique" ON "jobs" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "jobs_client_idx" ON "jobs" USING btree ("client_user_id");--> statement-breakpoint
CREATE INDEX "jobs_worker_idx" ON "jobs" USING btree ("worker_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "milestone_job_sequence_unique" ON "milestones" USING btree ("job_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "operations_idempotency_unique" ON "operations" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_file_storage_key_unique" ON "proof_files" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_milestone_version_unique" ON "proof_submissions" USING btree ("milestone_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "verification_token_hash_unique" ON "verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_challenge_nonce_unique" ON "wallet_challenges" USING btree ("nonce_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_user_network_address_unique" ON "wallets" USING btree ("user_id","network","address");--> statement-breakpoint
CREATE INDEX "wallet_user_idx" ON "wallets" USING btree ("user_id");