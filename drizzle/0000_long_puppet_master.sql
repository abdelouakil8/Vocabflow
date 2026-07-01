CREATE TABLE "review_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_progress_id" integer NOT NULL,
	"quality" integer NOT NULL,
	"response_time_ms" integer,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" integer NOT NULL,
	"ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	CONSTRAINT "word_progress_word_id_unique" UNIQUE("word_id")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"french_text" text NOT NULL,
	"type" text,
	"arabic_meaning" text NOT NULL,
	"example_sentence" text,
	"source_row" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "words_french_text_unique" UNIQUE("french_text")
);
--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_word_progress_id_word_progress_id_fk" FOREIGN KEY ("word_progress_id") REFERENCES "public"."word_progress"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_progress" ADD CONSTRAINT "word_progress_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_review_logs_reviewed_at" ON "review_logs" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "idx_word_progress_due_date" ON "word_progress" USING btree ("due_date");