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

public class AppRatingKFactorExperiment {

    private static final long POPULATION_SEED = 84L;
    private static final long ATTENDANCE_SEED = 1234L;
    private static final long RESULT_SEED = 5678L;

    private static final int NUMBER_OF_GROUPS = 30;
    private static final int PLAYERS_PER_GROUP = 20;

    /*
     * Plenty of nights so even lower-attendance players
     * can reach the 300-game checkpoint.
     */
    private static final int MAX_GAME_NIGHTS = 700;

    /*
     * Use many rounds to reduce short-term result noise.
     * This experiment is intended to isolate the K-factor.
     */
    private static final int ROUNDS_PER_GAME = 50;

    private static final int[] CHECKPOINTS = {
            0, 10, 20, 40, 80, 160, 300
    };

    private static final double BASE_K = 0.8;
    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    public static void main(String[] args)
            throws IOException {

        List<List<PlayerTemplate>> population =
                generatePopulation();

        double[][][] attendanceDraws =
                generateAttendanceDraws();

        double[][][] resultDraws =
                generateResultDraws();

        List<ExperimentResult> allResults =
                new ArrayList<>();

        for (KStrategy strategy : KStrategy.values()) {

            Map<Integer, List<Double>> errors =
                    initializeErrors();

            List<List<SimulatedPlayer>> groups =
                    createFreshPopulation(
                            population);

            recordInitialErrors(
                    groups,
                    errors);

            simulate(
                    groups,
                    strategy,
                    attendanceDraws,
                    resultDraws,
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
                        new ExperimentResult(
                                strategy,
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

    private static double[][][]
            generateAttendanceDraws() {

        Random random =
                new Random(ATTENDANCE_SEED);

        double[][][] draws =
                new double
                        [NUMBER_OF_GROUPS]
                        [MAX_GAME_NIGHTS]
                        [PLAYERS_PER_GROUP];

        for (int group = 0;
                group < NUMBER_OF_GROUPS;
                group++) {

            for (int game = 0;
                    game < MAX_GAME_NIGHTS;
                    game++) {

                for (int player = 0;
                        player < PLAYERS_PER_GROUP;
                        player++) {

                    draws[group][game][player] =
                            random.nextDouble();
                }
            }
        }

        return draws;
    }

    private static double[][][]
            generateResultDraws() {

        Random random =
                new Random(RESULT_SEED);

        double[][][] draws =
                new double
                        [NUMBER_OF_GROUPS]
                        [MAX_GAME_NIGHTS]
                        [ROUNDS_PER_GAME];

        for (int group = 0;
                group < NUMBER_OF_GROUPS;
                group++) {

            for (int game = 0;
                    game < MAX_GAME_NIGHTS;
                    game++) {

                for (int round = 0;
                        round < ROUNDS_PER_GAME;
                        round++) {

                    draws[group][game][round] =
                            random.nextDouble();
                }
            }
        }

        return draws;
    }

    private static List<List<SimulatedPlayer>>
            createFreshPopulation(
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
            initializeErrors() {

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

        for (List<SimulatedPlayer> group : groups) {

            for (SimulatedPlayer player : group) {

                errors.get(0)
                        .add(
                                absoluteError(
                                        player.appRating,
                                        player.trueSkill));
            }
        }
    }

    private static void simulate(
            List<List<SimulatedPlayer>> groups,
            KStrategy strategy,
            double[][][] attendanceDraws,
            double[][][] resultDraws,
            Map<Integer, List<Double>> errors) {

        for (int groupIndex = 0;
                groupIndex < groups.size();
                groupIndex++) {

            List<SimulatedPlayer> group =
                    groups.get(groupIndex);

            for (int gameNight = 0;
                    gameNight < MAX_GAME_NIGHTS;
                    gameNight++) {

                if (allPlayersReachedMaximumCheckpoint(
                        group)) {
                    break;
                }

                List<SimulatedPlayer> available =
                        generateAvailableLineup(
                                group,
                                attendanceDraws
                                        [groupIndex]
                                        [gameNight]);

                if (available.size() < 6) {
                    continue;
                }

                List<List<SimulatedPlayer>> teams =
                        generateKickSplitTeams(
                                available);

                int[] wins =
                        simulateGameResult(
                                teams,
                                resultDraws
                                        [groupIndex]
                                        [gameNight]);

                applyRatingUpdate(
                        teams,
                        wins,
                        strategy);

                recordCheckpointErrors(
                        available,
                        errors);
            }
        }
    }

    private static boolean
            allPlayersReachedMaximumCheckpoint(
                    List<SimulatedPlayer> group) {

        int maximumCheckpoint =
                CHECKPOINTS[
                        CHECKPOINTS.length - 1];

        for (SimulatedPlayer player : group) {

            if (player.ratedGames
                    < maximumCheckpoint) {

                return false;
            }
        }

        return true;
    }

    private static List<SimulatedPlayer>
            generateAvailableLineup(
                    List<SimulatedPlayer> group,
                    double[] draws) {

        List<SimulatedPlayer> available =
                new ArrayList<>();

        for (int index = 0;
                index < group.size();
                index++) {

            SimulatedPlayer player =
                    group.get(index);

            if (draws[index]
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

        Map<Long, SimulatedPlayer> playersById =
                new LinkedHashMap<>();

        for (SimulatedPlayer player : available) {

            candidates.add(
                    new PlayerCandidate(
                            player.id,
                            player.name,
                            player.appRating));

            playersById.put(
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
                    "No KickSplit proposal generated.");
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
                        playersById.get(
                                candidate.getUserId());

                if (player == null) {
                    throw new IllegalStateException(
                            "Could not map player.");
                }

                team.add(player);
            }

            teams.add(team);
        }

        return teams;
    }

    private static int[] simulateGameResult(
            List<List<SimulatedPlayer>> teams,
            double[] draws) {

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

        double[] trueShares =
                new double[3];

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            trueShares[teamIndex] =
                    trueStrengths[teamIndex]
                            / totalTrueStrength;
        }

        int[] wins =
                new int[3];

        for (int round = 0;
                round < ROUNDS_PER_GAME;
                round++) {

            double draw =
                    draws[round];

            double cumulative = 0.0;

            for (int teamIndex = 0;
                    teamIndex < 3;
                    teamIndex++) {

                cumulative +=
                        trueShares[teamIndex];

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

    private static double calculateEstimatedStrength(
            List<SimulatedPlayer> team) {

        return team.stream()
                .mapToDouble(
                        player ->
                                player.appRating)
                .average()
                .orElse(0.0);
    }

    private static void applyRatingUpdate(
            List<List<SimulatedPlayer>> teams,
            int[] wins,
            KStrategy strategy) {

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
                        calculateK(
                                strategy,
                                gamesBefore);

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

    private static double calculateK(
            KStrategy strategy,
            int gamesBefore) {

        double games =
                gamesBefore + 1.0;

        return switch (strategy) {

            case CURRENT ->
                    BASE_K
                            / Math.sqrt(games);

            case SLOW_DECAY ->
                    BASE_K
                            / Math.pow(
                                    games,
                                    0.25);

            case FLOOR_0_10 ->
                    Math.max(
                            0.10,
                            BASE_K
                                    / Math.sqrt(
                                            games));
        };
    }

    private static void recordCheckpointErrors(
            List<SimulatedPlayer> available,
            Map<Integer, List<Double>> errors) {

        for (SimulatedPlayer player : available) {

            for (int checkpoint : CHECKPOINTS) {

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
            List<ExperimentResult> results) {

        System.out.println();
        System.out.println(
                "===== APP RATING K-FACTOR EXPERIMENT =====");

        System.out.println(
                "Groups: "
                        + NUMBER_OF_GROUPS);

        System.out.println(
                "Players per group: "
                        + PLAYERS_PER_GROUP);

        System.out.println(
                "Rounds per game: "
                        + ROUNDS_PER_GAME);

        for (KStrategy strategy
                : KStrategy.values()) {

            System.out.println();
            System.out.println(
                    "----- "
                            + strategy
                            + " -----");

            System.out.println(
                    "Games | Observations | MAE");

            for (ExperimentResult result
                    : results) {

                if (result.strategy()
                        != strategy) {
                    continue;
                }

                System.out.printf(
                        Locale.US,
                        "%5d | %12d | %.4f%n",
                        result.ratedGames(),
                        result.observations(),
                        result.mae());
            }
        }

        System.out.println();
        System.out.println(
                "==========================================");
    }

    private static Path writeCsv(
            List<ExperimentResult> results)
            throws IOException {

        Path directory =
                Path.of("experiment-results");

        Files.createDirectories(
                directory);

        Path output =
                directory.resolve(
                        "app-rating-k-factor.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        output,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "strategy,"
                            + "ratedGames,"
                            + "observations,"
                            + "mae");

            writer.newLine();

            for (ExperimentResult result
                    : results) {

                writer.write(
                        String.format(
                                Locale.US,
                                "%s,%d,%d,%.6f",
                                result.strategy(),
                                result.ratedGames(),
                                result.observations(),
                                result.mae()));

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

    private enum KStrategy {
        CURRENT,
        SLOW_DECAY,
        FLOOR_0_10
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

            this.appRating =
                    selfRating;

            this.ratedGames = 0;
        }
    }

    private record ExperimentResult(
            KStrategy strategy,
            int ratedGames,
            int observations,
            double mae) {
    }
}