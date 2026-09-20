-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "season_year" INTEGER NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "home_score" INTEGER NOT NULL,
    "away_score" INTEGER NOT NULL,
    "total_goals" INTEGER NOT NULL,
    "scorers_data" JSONB NOT NULL DEFAULT '[]',
    "stats_data" JSONB NOT NULL DEFAULT '[]',
    "rosters_data" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_season_year_total_goals_idx" ON "matches"("season_year", "total_goals" DESC);

-- CreateIndex
CREATE INDEX "matches_league_id_idx" ON "matches"("league_id");

-- CreateIndex
CREATE INDEX "matches_match_date_idx" ON "matches"("match_date");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
