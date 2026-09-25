package com.kicksplit.backend.experiments;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import com.kicksplit.backend.algorithm.BalanceCalculator;
import com.kicksplit.backend.algorithm.PlayerCandidate;

public class AppRatingKNoiseGridExperiment {

    private static final long POPULATION_SEED = 84L;
    private static final long ATTENDANCE_SEED = 1234L;
    private static final long RESULT_SEED = 5678L;
    private static final long TEAM_SPLIT_SEED = 9876L;

    private static final int NUMBER_OF_GROUPS = 20;
    private static final int PLAYERS_PER_GROUP = 20;
    private static final int MAX_GAME_NIGHTS = 650;
    private static final int MAX_ROUNDS = 50;

    private static final int[] ROUND_COUNTS = {
            5, 10, 20, 50
    };

    private static final int[] CHECKPOINTS = {
            0, 40, 80, 160, 300
    };

    private static final double BASE_K = 0.8;
    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    private static final BalanceCalculator BALANCE_CALCULATOR =
            new BalanceCalculator();

    public static void main(String[] args)
            throws IOException {

        List<List<PlayerTemplate>> population =
                generatePopulation();

        double[][][] attendanceDraws =
                generateAttendanceDraws();

        double[][][] resultDraws =
                generateResultDraws();

        List<ExperimentResult> results =
                new ArrayList<>();

        for (int roundsPerGame : ROUND_COUNTS) {

            for (KStrategy strategy
                    : KStrategy.values()) {

                List<List<SimulatedPlayer>> groups =
                        createFreshPopulation(population);

                Map<Integer, List<Double>> errors =
                        initializeErrors();

                recordInitialErrors(groups, errors);

                simulate(
                        groups,
                        roundsPerGame,
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

                    results.add(
                            new ExperimentResult(
                                    roundsPerGame,
                                    strategy,
                                    checkpoint,
                                    checkpointErrors.size(),
                                    mae));
                }
            }
        }

        printResults(results);

        Path csv = writeCsv(results);

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
                        [MAX_ROUNDS];

        for (int group = 0;
                group < NUMBER_OF_GROUPS;
                group++) {

            for (int game = 0;
                    game < MAX_GAME_NIGHTS;
                    game++) {

                for (int round = 0;
                        round < MAX_ROUNDS;
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
            int roundsPerGame,
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

                long splitSeed =
                        TEAM_SPLIT_SEED
                                + ((long) groupIndex
                                        * 1_000_003L)
                                + gameNight;

                List<List<SimulatedPlayer>> teams =
                        generateKickSplitTeams(
                                available,
                                splitSeed);

                int[] wins =
                        simulateGameResult(
                                teams,
                                roundsPerGame,
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
                    List<SimulatedPlayer> available,
                    long splitSeed) {

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

        Random random =
                new Random(splitSeed);

        Set<String> seenProposals =
                new HashSet<>();

        List<GeneratedProposal> proposals =
                new ArrayList<>();

        for (int attempt = 0;
                attempt < 100;
                attempt++) {

            List<PlayerCandidate> copy =
                    new ArrayList<>(candidates);

            List<List<PlayerCandidate>> teams =
                    deterministicSplit(
                            copy,
                            random);

            String key =
                    createProposalKey(teams);

            if (!seenProposals.add(key)) {
                continue;
            }

            double score =
                    BALANCE_CALCULATOR
                            .calculateBalanceScore(
                                    teams);

            proposals.add(
                    new GeneratedProposal(
                            teams,
                            score));
        }

        if (proposals.isEmpty()) {
            throw new IllegalStateException(
                    "No KickSplit proposal generated.");
        }

        proposals.sort(
                Comparator.comparingDouble(
                        GeneratedProposal::balanceScore));

        GeneratedProposal best =
                proposals.get(0);

        List<List<SimulatedPlayer>> result =
                new ArrayList<>();

        for (List<PlayerCandidate> candidateTeam
                : best.teams()) {

            List<SimulatedPlayer> team =
                    new ArrayList<>();

            for (PlayerCandidate candidate
                    : candidateTeam) {

                SimulatedPlayer player =
                        playersById.get(
                                candidate.getUserId());

                if (player == null) {
                    throw new IllegalStateException(
                            "Could not map simulated player.");
                }

                team.add(player);
            }

            result.add(team);
        }

        return result;
    }

    private static List<List<PlayerCandidate>>
            deterministicSplit(
                    List<PlayerCandidate> players,
                    Random random) {

        if (players.size() < 3) {
            throw new IllegalArgumentException(
                    "At least 3 players are required");
        }

        players.sort(
                (a, b) ->
                        Double.compare(
                                b.getRating(),
                                a.getRating()));

        List<List<PlayerCandidate>> teams =
                new ArrayList<>();

        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());

        double[] teamSums =
                new double[3];

        int baseSize =
                players.size() / 3;

        int remainder =
                players.size() % 3;

        int[] targetSizes = {
                baseSize
                        + (remainder > 0 ? 1 : 0),
                baseSize
                        + (remainder > 1 ? 1 : 0),
                baseSize
        };

        for (PlayerCandidate player : players) {

            double minSum =
                    Double.POSITIVE_INFINITY;

            List<Integer> bestTeams =
                    new ArrayList<>();

            for (int i = 0;
                    i < 3;
                    i++) {

                if (teams.get(i).size()
                        >= targetSizes[i]) {
                    continue;
                }

                if (teamSums[i] < minSum) {

                    minSum =
                            teamSums[i];

                    bestTeams.clear();
                    bestTeams.add(i);

                } else if (Double.compare(
                        teamSums[i],
                        minSum) == 0) {

                    bestTeams.add(i);
                }
            }

            int bestTeam =
                    bestTeams.get(
                            random.nextInt(
                                    bestTeams.size()));

            teams.get(bestTeam)
                    .add(player);

            teamSums[bestTeam] +=
                    player.getRating();
        }

        return teams;
    }

    private static String createProposalKey(
            List<List<PlayerCandidate>> teams) {

        List<String> teamKeys =
                new ArrayList<>();

        for (List<PlayerCandidate> team : teams) {

            List<String> playerNames =
                    new ArrayList<>();

            for (PlayerCandidate player : team) {
                playerNames.add(
                        player.getName());
            }

            playerNames.sort(
                    String::compareTo);

            teamKeys.add(
                    String.join(
                            ",",
                            playerNames));
        }

        teamKeys.sort(
                String::compareTo);

        return String.join(
                "|",
                teamKeys);
    }

    private static int[] simulateGameResult(
            List<List<SimulatedPlayer>> teams,
            int roundsPerGame,
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
                round < roundsPerGame;
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

                double k =
                        calculateK(
                                strategy,
                                player.ratedGames);

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

        double currentK =
                BASE_K
                        / Math.sqrt(games);

        return switch (strategy) {

            case CURRENT ->
                    currentK;

            case FLOOR_0_05 ->
                    Math.max(
                            0.05,
                            currentK);

            case FLOOR_0_10 ->
                    Math.max(
                            0.10,
                            currentK);

            case FLOOR_0_15 ->
                    Math.max(
                            0.15,
                            currentK);

            case FLOOR_0_20 ->
                    Math.max(
                            0.20,
                            currentK);
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
                "===== DETERMINISTIC K-FACTOR FLOOR SWEEP =====");

        System.out.println(
                "Groups: "
                        + NUMBER_OF_GROUPS);

        System.out.println(
                "Players per group: "
                        + PLAYERS_PER_GROUP);

        for (int rounds : ROUND_COUNTS) {

            System.out.println();
            System.out.println(
                    "===== "
                            + rounds
                            + " ROUNDS PER GAME =====");

            for (KStrategy strategy
                    : KStrategy.values()) {

                System.out.println();
                System.out.println(strategy);

                System.out.println(
                        "Games | Observations | MAE");

                for (ExperimentResult result
                        : results) {

                    if (result.roundsPerGame()
                            != rounds
                            || result.strategy()
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
        }
    }

    private static Path writeCsv(
            List<ExperimentResult> results)
            throws IOException {

        Path directory =
                Path.of("experiment-results");

        Files.createDirectories(directory);

        Path output =
                directory.resolve(
                        "app-rating-k-floor-sweep-deterministic.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        output,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "roundsPerGame,"
                            + "strategy,"
                            + "ratedGames,"
                            + "observations,"
                            + "mae");

            writer.newLine();

            for (ExperimentResult result
                    : results) {

                writer.write(
                        String.format(
                                Locale.US,
                                "%d,%s,%d,%d,%.6f",
                                result.roundsPerGame(),
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
        FLOOR_0_05,
        FLOOR_0_10,
        FLOOR_0_15,
        FLOOR_0_20
    }

    private record PlayerTemplate(
            long id,
            String name,
            double trueSkill,
            double selfRating,
            double attendanceProbability) {
    }

    private record GeneratedProposal(
            List<List<PlayerCandidate>> teams,
            double balanceScore) {
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
            int roundsPerGame,
            KStrategy strategy,
            int ratedGames,
            int observations,
            double mae) {
    }
}