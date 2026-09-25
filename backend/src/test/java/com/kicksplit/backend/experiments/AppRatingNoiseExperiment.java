package com.kicksplit.backend.experiments;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

import com.kicksplit.backend.algorithm.PlayerCandidate;
import com.kicksplit.backend.algorithm.TeamProposal;
import com.kicksplit.backend.algorithm.TeamProposalGenerator;

public class AppRatingNoiseExperiment {

    private static final long POPULATION_SEED = 84L;
    private static final long ATTENDANCE_SEED = 1234L;
    private static final long RESULT_SEED = 5678L;

    private static final int NUMBER_OF_GROUPS = 60;
    private static final int PLAYERS_PER_GROUP = 20;
    private static final int GAME_NIGHTS = 80;

    private static final int[] ROUND_COUNTS = {
            5, 10, 20, 50
    };

    private static final int[] CHECKPOINTS = {
            0, 5, 10, 20, 40
    };

    private static final double BASE_K = 0.8;
    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    public static void main(String[] args)
            throws IOException {

        List<List<PlayerTemplate>> templates =
                generatePopulation();

        List<NoiseResult> allResults =
                new ArrayList<>();

        for (int roundsPerGame : ROUND_COUNTS) {

            List<List<SimulatedPlayer>> groups =
                    createFreshPlayers(templates);

            Map<Integer, List<Double>> errors =
                    initializeCheckpointErrors();

            recordInitialErrors(
                    groups,
                    errors);

            simulateSeason(
                    groups,
                    roundsPerGame,
                    errors);

            for (int checkpoint : CHECKPOINTS) {

                List<Double> checkpointErrors =
                        errors.get(checkpoint);

                double mae =
                        checkpointErrors.stream()
                                .mapToDouble(Double::doubleValue)
                                .average()
                                .orElse(0.0);

                allResults.add(
                        new NoiseResult(
                                roundsPerGame,
                                checkpoint,
                                checkpointErrors.size(),
                                mae));
            }
        }

        printResults(allResults);

        Path csv =
                writeCsv(allResults);

        System.out.println();
        System.out.println(
                "CSV saved to: "
                        + csv.toAbsolutePath());
    }

    private static List<List<PlayerTemplate>>
            generatePopulation() {

        Random random =
                new Random(POPULATION_SEED);

        List<List<PlayerTemplate>> groups =
                new ArrayList<>();

        long nextId = 1L;

        for (int groupIndex = 0;
                groupIndex < NUMBER_OF_GROUPS;
                groupIndex++) {

            List<PlayerTemplate> group =
                    new ArrayList<>();

            for (int playerIndex = 0;
                    playerIndex < PLAYERS_PER_GROUP;
                    playerIndex++) {

                double trueSkill =
                        clamp(
                                3.0
                                        + random.nextGaussian()
                                        * 0.80);

                double selfRating =
                        clamp(
                                trueSkill
                                        + random.nextGaussian()
                                        * 0.60);

                double attendanceProbability =
                        0.60
                                + random.nextDouble()
                                * 0.30;

                group.add(
                        new PlayerTemplate(
                                nextId++,
                                "G"
                                        + (groupIndex + 1)
                                        + "_P"
                                        + (playerIndex + 1),
                                trueSkill,
                                selfRating,
                                attendanceProbability));
            }

            groups.add(group);
        }

        return groups;
    }

    private static List<List<SimulatedPlayer>>
            createFreshPlayers(
                    List<List<PlayerTemplate>> templates) {

        List<List<SimulatedPlayer>> groups =
                new ArrayList<>();

        for (List<PlayerTemplate> templateGroup
                : templates) {

            List<SimulatedPlayer> group =
                    new ArrayList<>();

            for (PlayerTemplate template
                    : templateGroup) {

                group.add(
                        new SimulatedPlayer(
                                template.id(),
                                template.name(),
                                template.trueSkill(),
                                template.selfRating(),
                                template.attendanceProbability()));
            }

            groups.add(group);
        }

        return groups;
    }

    private static Map<Integer, List<Double>>
            initializeCheckpointErrors() {

        Map<Integer, List<Double>> errors =
                new LinkedHashMap<>();

        for (int checkpoint : CHECKPOINTS) {
            errors.put(
                    checkpoint,
                    new ArrayList<>());
        }

        return errors;
    }

    private static void recordInitialErrors(
            List<List<SimulatedPlayer>> groups,
            Map<Integer, List<Double>> errors) {

        for (List<SimulatedPlayer> group
                : groups) {

            for (SimulatedPlayer player
                    : group) {

                errors.get(0)
                        .add(
                                absoluteError(
                                        player.appRating,
                                        player.trueSkill));
            }
        }
    }

    private static void simulateSeason(
            List<List<SimulatedPlayer>> groups,
            int roundsPerGame,
            Map<Integer, List<Double>> errors) {

        for (int groupIndex = 0;
                groupIndex < groups.size();
                groupIndex++) {

            List<SimulatedPlayer> group =
                    groups.get(groupIndex);

            for (int gameNight = 1;
                    gameNight <= GAME_NIGHTS;
                    gameNight++) {

                List<SimulatedPlayer> available =
                        generateAvailableLineup(
                                group,
                                groupIndex,
                                gameNight);

                if (available.size() < 6) {
                    continue;
                }

                List<List<SimulatedPlayer>> teams =
                        generateKickSplitTeams(
                                available);

                int[] wins =
                        simulateGameResult(
                                teams,
                                groupIndex,
                                gameNight,
                                roundsPerGame);

                applyAppRatingUpdate(
                        teams,
                        wins);

                recordCheckpointErrors(
                        available,
                        errors);
            }
        }
    }

    private static List<SimulatedPlayer>
            generateAvailableLineup(
                    List<SimulatedPlayer> group,
                    int groupIndex,
                    int gameNight) {

        /*
         * Attendance receives its own deterministic seed.
         *
         * Therefore the same group and game night
         * produce the same available players
         * in every rounds-per-game condition.
         */
        long seed =
                ATTENDANCE_SEED
                        + groupIndex * 10_000L
                        + gameNight;

        Random attendanceRandom =
                new Random(seed);

        List<SimulatedPlayer> available =
                new ArrayList<>();

        for (SimulatedPlayer player : group) {

            if (attendanceRandom.nextDouble()
                    <= player.attendanceProbability) {

                available.add(player);
            }
        }

        return available;
    }

    private static List<List<SimulatedPlayer>>
            generateKickSplitTeams(
                    List<SimulatedPlayer> available) {

        List<PlayerCandidate> candidates =
                new ArrayList<>();

        Map<Long, SimulatedPlayer> byId =
                new LinkedHashMap<>();

        for (SimulatedPlayer player
                : available) {

            candidates.add(
                    new PlayerCandidate(
                            player.id,
                            player.name,
                            player.appRating));

            byId.put(
                    player.id,
                    player);
        }

        TeamProposalGenerator generator =
                new TeamProposalGenerator();

        List<TeamProposal> proposals =
                generator.generateProposals(
                        candidates);

        if (proposals.isEmpty()) {
            throw new IllegalStateException(
                    "KickSplit generated no team proposal.");
        }

        TeamProposal best =
                proposals.get(0);

        List<List<SimulatedPlayer>> teams =
                new ArrayList<>();

        for (List<PlayerCandidate> candidateTeam
                : best.getTeams()) {

            List<SimulatedPlayer> team =
                    new ArrayList<>();

            for (PlayerCandidate candidate
                    : candidateTeam) {

                SimulatedPlayer player =
                        byId.get(
                                candidate.getUserId());

                if (player == null) {
                    throw new IllegalStateException(
                            "Could not map simulated player.");
                }

                team.add(player);
            }

            teams.add(team);
        }

        return teams;
    }

    private static int[] simulateGameResult(
            List<List<SimulatedPlayer>> teams,
            int groupIndex,
            int gameNight,
            int roundsPerGame) {

        double[] trueStrengths =
                new double[3];

        double totalTrueStrength = 0.0;

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            trueStrengths[teamIndex] =
                    calculateTrueStrength(
                            teams.get(teamIndex));

            totalTrueStrength +=
                    trueStrengths[teamIndex];
        }

        /*
         * The result generator also receives a
         * deterministic game-specific seed.
         *
         * A 10-round experiment uses the same
         * first five random outcomes as the
         * 5-round experiment, then adds more evidence.
         */
        long seed =
                RESULT_SEED
                        + groupIndex * 10_000L
                        + gameNight;

        Random resultRandom =
                new Random(seed);

        int[] wins =
                new int[3];

        for (int round = 0;
                round < roundsPerGame;
                round++) {

            double draw =
                    resultRandom.nextDouble()
                            * totalTrueStrength;

            double cumulative = 0.0;

            for (int teamIndex = 0;
                    teamIndex < 3;
                    teamIndex++) {

                cumulative +=
                        trueStrengths[teamIndex];

                if (draw <= cumulative) {

                    wins[teamIndex]++;
                    break;
                }
            }
        }

        return wins;
    }

    private static double calculateTrueStrength(
            List<SimulatedPlayer> team) {

        return team.stream()
                .mapToDouble(
                        player ->
                                player.trueSkill)
                .average()
                .orElse(0.0);
    }

    private static void applyAppRatingUpdate(
            List<List<SimulatedPlayer>> teams,
            int[] wins) {

        double[] estimatedStrengths =
                new double[3];

        double totalEstimatedStrength = 0.0;

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            estimatedStrengths[teamIndex] =
                    calculateEstimatedStrength(
                            teams.get(teamIndex));

            totalEstimatedStrength +=
                    estimatedStrengths[teamIndex];
        }

        int totalWins =
                wins[0]
                        + wins[1]
                        + wins[2];

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            double expectedShare =
                    estimatedStrengths[teamIndex]
                            / totalEstimatedStrength;

            double actualShare =
                    totalWins == 0
                            ? expectedShare
                            : (double) wins[teamIndex]
                                    / totalWins;

            for (SimulatedPlayer player
                    : teams.get(teamIndex)) {

                int gamesBefore =
                        player.ratedGames;

                double k =
                        BASE_K
                                / Math.sqrt(
                                        gamesBefore
                                                + 1.0);

                double change =
                        k
                                * (actualShare
                                        - expectedShare);

                player.appRating =
                        clamp(
                                player.appRating
                                        + change);

                player.ratedGames++;
            }
        }
    }

    private static double calculateEstimatedStrength(
            List<SimulatedPlayer> team) {

        return team.stream()
                .mapToDouble(
                        player ->
                                player.appRating)
                .average()
                .orElse(0.0);
    }

    private static void recordCheckpointErrors(
            List<SimulatedPlayer> available,
            Map<Integer, List<Double>> errors) {

        for (SimulatedPlayer player
                : available) {

            for (int checkpoint
                    : CHECKPOINTS) {

                if (checkpoint == 0) {
                    continue;
                }

                if (player.ratedGames
                        == checkpoint) {

                    errors.get(checkpoint)
                            .add(
                                    absoluteError(
                                            player.appRating,
                                            player.trueSkill));
                }
            }
        }
    }

    private static void printResults(
            List<NoiseResult> results) {

        System.out.println();
        System.out.println(
                "===== APP RATING NOISE SENSITIVITY =====");

        System.out.println(
                "Same synthetic players and attendance");
        System.out.println();

        for (int rounds : ROUND_COUNTS) {

            System.out.println(
                    "----- "
                            + rounds
                            + " ROUNDS PER GAME -----");

            System.out.println(
                    "Games | Observations | App Rating MAE");

            for (NoiseResult result
                    : results) {

                if (result.roundsPerGame()
                        != rounds) {
                    continue;
                }

                System.out.printf(
                        Locale.US,
                        "%5d | %12d | %14.4f%n",
                        result.ratedGames(),
                        result.observations(),
                        result.appRatingMae());
            }

            System.out.println();
        }

        System.out.println(
                "========================================");
    }

    private static Path writeCsv(
            List<NoiseResult> results)
            throws IOException {

        Path directory =
                Path.of("experiment-results");

        Files.createDirectories(
                directory);

        Path output =
                directory.resolve(
                        "app-rating-noise-sensitivity.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        output,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "roundsPerGame,"
                            + "ratedGames,"
                            + "observations,"
                            + "appRatingMAE");

            writer.newLine();

            for (NoiseResult result
                    : results) {

                writer.write(
                        String.format(
                                Locale.US,
                                "%d,%d,%d,%.6f",
                                result.roundsPerGame(),
                                result.ratedGames(),
                                result.observations(),
                                result.appRatingMae()));

                writer.newLine();
            }
        }

        return output;
    }

    private static double absoluteError(
            double value,
            double trueSkill) {

        return Math.abs(
                value - trueSkill);
    }

    private static double clamp(
            double value) {

        return Math.max(
                MIN_RATING,
                Math.min(
                        MAX_RATING,
                        value));
    }

    private record PlayerTemplate(
            long id,
            String name,
            double trueSkill,
            double selfRating,
            double attendanceProbability) {
    }

    private static class SimulatedPlayer {

        private final long id;
        private final String name;

        private final double trueSkill;
        private final double selfRating;

        private final double attendanceProbability;

        private double appRating;
        private int ratedGames;

        private SimulatedPlayer(
                long id,
                String name,
                double trueSkill,
                double selfRating,
                double attendanceProbability) {

            this.id = id;
            this.name = name;

            this.trueSkill = trueSkill;
            this.selfRating = selfRating;

            this.attendanceProbability =
                    attendanceProbability;

            this.appRating = selfRating;
            this.ratedGames = 0;
        }
    }

    private record NoiseResult(
            int roundsPerGame,
            int ratedGames,
            int observations,
            double appRatingMae) {
    }
}