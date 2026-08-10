CREATE TYPE "public"."job_category" AS ENUM('DESIGN', 'DEVELOPMENT', 'WRITING', 'MARKETING', 'DATA', 'ADMIN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."job_listing_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED', 'AWARDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('SUBMITTED', 'WITHDRAWN', 'REJECTED', 'ACCEPTED');--> statement-breakpoint
CREATE TABLE "job_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_user_id" uuid NOT NULL,
	"title" varchar(90) NOT NULL,
	"description" text NOT NULL,
	"category" "job_category" NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"asset" varchar(30) DEFAULT 'CKB' NOT NULL,
	"asset_decimals" integer DEFAULT 8 NOT NULL,
	"budget_min" bigint NOT NULL,
	"budget_max" bigint NOT NULL,
	"proposal_deadline" timestamp with time zone NOT NULL,
	"status" "job_listing_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"awarded_job_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_listing_budget_valid" CHECK ("job_listings"."budget_min" > 0 AND "job_listings"."budget_max" >= "job_listings"."budget_min")
);
--> statement-breakpoint
CREATE TABLE "proposal_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"evidence_requirements" text NOT NULL,
	"delivery_days" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_milestone_amount_positive" CHECK ("proposal_milestones"."amount" > 0),
	CONSTRAINT "proposal_milestone_delivery_valid" CHECK ("proposal_milestones"."delivery_days" BETWEEN 1 AND 365)
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"worker_user_id" uuid NOT NULL,
	"cover_letter" text NOT NULL,
	"total_bid" bigint NOT NULL,
	"estimated_duration_days" integer NOT NULL,
	"status" "proposal_status" DEFAULT 'SUBMITTED' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_amount_positive" CHECK ("proposals"."total_bid" > 0),
	CONSTRAINT "proposal_duration_valid" CHECK ("proposals"."estimated_duration_days" BETWEEN 1 AND 365)
);
--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_awarded_job_id_jobs_id_fk" FOREIGN KEY ("awarded_job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_milestones" ADD CONSTRAINT "proposal_milestones_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_listing_id_job_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_worker_user_id_users_id_fk" FOREIGN KEY ("worker_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_listings_client_idx" ON "job_listings" USING btree ("client_user_id");--> statement-breakpoint
CREATE INDEX "job_listings_discovery_idx" ON "job_listings" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_milestone_sequence_unique" ON "proposal_milestones" USING btree ("proposal_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_listing_worker_unique" ON "proposals" USING btree ("listing_id","worker_user_id");--> statement-breakpoint
CREATE INDEX "proposals_listing_idx" ON "proposals" USING btree ("listing_id","created_at");--> statement-breakpoint
CREATE INDEX "proposals_worker_idx" ON "proposals" USING btree ("worker_user_id","created_at");