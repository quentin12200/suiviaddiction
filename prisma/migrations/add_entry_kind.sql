-- Type de consommation : "cigarette" ou "joint" (vide = ancienne entrée, comptée comme joint)
ALTER TABLE "Entry" ADD COLUMN "kind" TEXT;
