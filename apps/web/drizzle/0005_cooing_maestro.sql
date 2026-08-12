CREATE TYPE "public"."availability_status" AS ENUM('AVAILABLE', 'LIMITED', 'UNAVAILABLE');--> statement-breakpoint
CREATE TABLE "job_listing_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"title" varchar(120) NOT NULL,
	"deliverable" text NOT NULL,
	"acceptance_criteria" text NOT NULL,
	"evidence_requirements" text NOT NULL,
	"delivery_days" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_listing_milestone_delivery_valid" CHECK ("job_listing_milestones"."delivery_days" BETWEEN 1 AND 365)
);
--> statement-breakpoint
CREATE TABLE "marketplace_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"subject_user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_review_rating_valid" CHECK ("marketplace_reviews"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "marketplace_review_distinct_users" CHECK ("marketplace_reviews"."reviewer_user_id" <> "marketplace_reviews"."subject_user_id")
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"project_url" text,
	"github_url" text,
	"media_key" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"project_role" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_message_body_length" CHECK (char_length("proposal_messages"."body") BETWEEN 1 AND 2000)
);
--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "acceptance_criteria" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "primary_role" varchar(100);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "skills" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "experience_level" varchar(30);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "years_experience" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "availability" "availability_status" DEFAULT 'AVAILABLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "preferred_work_categories" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "proposal_milestones" ADD COLUMN "acceptance_criteria" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "shortlisted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "shortlisted_by" uuid;--> statement-breakpoint
ALTER TABLE "job_listing_milestones" ADD CONSTRAINT "job_listing_milestones_listing_id_job_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_messages" ADD CONSTRAINT "proposal_messages_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_messages" ADD CONSTRAINT "proposal_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_listing_milestone_sequence_unique" ON "job_listing_milestones" USING btree ("listing_id","sequence");--> statement-breakpoint
CREATE INDEX "job_listing_milestones_listing_idx" ON "job_listing_milestones" USING btree ("listing_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_review_job_reviewer_unique" ON "marketplace_reviews" USING btree ("job_id","reviewer_user_id");--> statement-breakpoint
CREATE INDEX "marketplace_reviews_subject_idx" ON "marketplace_reviews" USING btree ("subject_user_id","created_at");--> statement-breakpoint
CREATE INDEX "marketplace_reviews_job_idx" ON "marketplace_reviews" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "portfolio_items_user_idx" ON "portfolio_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "portfolio_items_skills_gin_idx" ON "portfolio_items" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "proposal_messages_thread_idx" ON "proposal_messages" USING btree ("proposal_id","created_at");--> statement-breakpoint
CREATE INDEX "proposal_messages_sender_idx" ON "proposal_messages" USING btree ("sender_user_id","created_at");--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_shortlisted_by_users_id_fk" FOREIGN KEY ("shortlisted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_talent_role_idx" ON "profiles" USING btree ("primary_role");--> statement-breakpoint
CREATE INDEX "profiles_talent_availability_idx" ON "profiles" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "profiles_talent_country_idx" ON "profiles" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "profiles_skills_gin_idx" ON "profiles" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "proposals_shortlist_idx" ON "proposals" USING btree ("listing_id","shortlisted_at");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_years_experience_valid" CHECK ("profiles"."years_experience" IS NULL OR "profiles"."years_experience" BETWEEN 0 AND 80);