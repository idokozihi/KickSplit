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

public class AppRatingVsPeerRatingExperiment {

    private static final int NUMBER_OF_SEED_SETS = 5;

    private static final int NUMBER_OF_GROUPS = 20;
    private static final int PLAYERS_PER_GROUP = 20;

    private static final int MAX_GAME_NIGHTS = 650;
    private static final int MAX_ROUNDS = 50;

    private static final int[] ROUND_COUNTS = {
            5, 10, 20, 50
    };

    private static final int[] CHECKPOINTS = {
            0, 5, 10, 20, 50, 100, 300
    };

    private static final int[] PEER_COUNTS = {
            1, 3, 5
    };

    private static final double[] PEER_NOISE_STDDEVS = {
            0.40, 0.80, 1.20
    };

    private static final int MAX_PEERS = 5;

    private static final double BASE_K = 0.8;
    private static final double MIN_K = 0.10;

    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    private static final BalanceCalculator BALANCE_CALCULATOR =
            new BalanceCalculator();

    public static void main(String[] args)
            throws IOException {

        List<ExperimentResult> results =
                new ArrayList<>();

        for (int seedSet = 0;
                seedSet < NUMBER_OF_SEED_SETS;
                seedSet++) {

            long offset =
                    seedSet * 10_000L;

            long populationSeed =
                    84L + offset;

            long attendanceSeed =
                    1234L + offset;

            long resultSeed =
                    5678L + offset;

            long teamSplitSeed =
                    9876L + offset;

            long peerSeed =
                    2468L + offset;

            List<List<PlayerTemplate>> population =
                    generatePopulation(
                            populationSeed);

            double[][][] attendanceDraws =
                    generateAttendanceDraws(
                            attendanceSeed);

            double[][][] resultDraws =
                    generateResultDraws(
                            resultSeed);

            double[][][] peerNoiseDraws =
                    generatePeerNoiseDraws(
                            peerSeed);

            for (int roundsPerGame
                    : ROUND_COUNTS) {

                List<List<SimulatedPlayer>> groups =
                        createFreshPopulation(
                                population);

                Map<Integer, List<Double>> appErrors =
                        initializeErrors();

                recordInitialAppErrors(
                        groups,
                        appErrors);

                simulate(
                        groups,
                        roundsPerGame,
                        attendanceDraws,
                        resultDraws,
                        teamSplitSeed,
                        appErrors);

                for (int peerCount
                        : PEER_COUNTS) {

                    for (double peerNoise
                            : PEER_NOISE_STDDEVS) {

                        List<Double> peerErrors =
                                calculatePeerErrors(
                                        population,
                                        peerNoiseDraws,
                                        peerCount,
                                        peerNoise);

                        double peerMae =
                                average(peerErrors);

                        for (int checkpoint
                                : CHECKPOINTS) {

                            List<Double> checkpointErrors =
                                    appErrors.get(
                                            checkpoint);

                            double appMae =
                                    average(
                                            checkpointErrors);

                            results.add(
                                    new ExperimentResult(
                                            seedSet + 1,
                                            roundsPerGame,
                                            peerCount,
                                            peerNoise,
                                            checkpoint,
                                            checkpointErrors.size(),
                                            peerErrors.size(),
                                            appMae,
                                            peerMae));
                        }
                    }
                }
            }
        }

        printResults(results);

        Path csv =
                writeCsv(results);

        System.out.println();
        System.out.println(
                "CSV saved to: "
                        + csv.toAbsolutePath());
    }

    private static List<List<PlayerTemplate>>
            generatePopulation(
                    long seed) {

        Random random =
                new Random(seed);

        List<List<PlayerTemplate>> groups =
                new ArrayList<>();

        long nextId =
                1L;

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
            generateAttendanceDraws(
                    long seed) {

        Random random =
                new Random(seed);

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
            generateResultDraws(
                    long seed) {

        Random random =
                new Random(seed);

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

    private static double[][][]
            generatePeerNoiseDraws(
                    long seed) {

        Random random =
                new Random(seed);

        double[][][] draws =
                new double
                        [NUMBER_OF_GROUPS]
                        [PLAYERS_PER_GROUP]
                        [MAX_PEERS];

        for (int group = 0;
                group < NUMBER_OF_GROUPS;
                group++) {

            for (int player = 0;
                    player < PLAYERS_PER_GROUP;
                    player++) {

                for (int peer = 0;
                        peer < MAX_PEERS;
                        peer++) {

                    draws[group][player][peer] =
                            random.nextGaussian();
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

        for (int checkpoint
                : CHECKPOINTS) {

            errors.put(
                    checkpoint,
                    new ArrayList<>());
        }

        return errors;
    }

    private static void recordInitialAppErrors(
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

    private static void simulate(
            List<List<SimulatedPlayer>> groups,
            int roundsPerGame,
            double[][][] attendanceDraws,
            double[][][] resultDraws,
            long teamSplitSeed,
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
                        teamSplitSeed
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
                        wins);

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

        for (SimulatedPlayer player
                : group) {

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

        for (SimulatedPlayer player
                : available) {

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
                    new ArrayList<>(
                            candidates);

            List<List<PlayerCandidate>> teams =
                    deterministicSplit(
                            copy,
                            random);

            String key =
                    createProposalKey(
                            teams);

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

        for (PlayerCandidate player
                : players) {

            double minSum =
                    Double.POSITIVE_INFINITY;

            List<Integer> bestTeams =
                    new ArrayList<>();

            for (int teamIndex = 0;
                    teamIndex < 3;
                    teamIndex++) {

                if (teams.get(teamIndex).size()
                        >= targetSizes[teamIndex]) {

                    continue;
                }

                if (teamSums[teamIndex]
                        < minSum) {

                    minSum =
                            teamSums[teamIndex];

                    bestTeams.clear();

                    bestTeams.add(
                            teamIndex);

                } else if (Double.compare(
                        teamSums[teamIndex],
                        minSum) == 0) {

                    bestTeams.add(
                            teamIndex);
                }
            }

            int selectedTeam =
                    bestTeams.get(
                            random.nextInt(
                                    bestTeams.size()));

            teams.get(selectedTeam)
                    .add(player);

            teamSums[selectedTeam] +=
                    player.getRating();
        }

        return teams;
    }

    private static String createProposalKey(
            List<List<PlayerCandidate>> teams) {

        List<String> teamKeys =
                new ArrayList<>();

        for (List<PlayerCandidate> team
                : teams) {

            List<String> playerNames =
                    new ArrayList<>();

            for (PlayerCandidate player
                    : team) {

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

        double totalTrueStrength =
                0.0;

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            trueStrengths[teamIndex] =
                    calculateTrueStrength(
                            teams.get(
                                    teamIndex));

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

            double cumulative =
                    0.0;

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
            int[] wins) {

        double[] estimatedStrengths =
                new double[3];

        double totalEstimatedStrength =
                0.0;

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            estimatedStrengths[teamIndex] =
                    calculateEstimatedStrength(
                            teams.get(
                                    teamIndex));

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

                double currentK =
                        BASE_K
                                / Math.sqrt(
                                        gamesBefore
                                                + 1.0);

                double k =
                        Math.max(
                                MIN_K,
                                currentK);

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

    private static List<Double>
            calculatePeerErrors(
                    List<List<PlayerTemplate>> population,
                    double[][][] noiseDraws,
                    int peerCount,
                    double noiseStandardDeviation) {

        List<Double> errors =
                new ArrayList<>();

        for (int groupIndex = 0;
                groupIndex < population.size();
                groupIndex++) {

            List<PlayerTemplate> group =
                    population.get(
                            groupIndex);

            for (int playerIndex = 0;
                    playerIndex < group.size();
                    playerIndex++) {

                PlayerTemplate player =
                        group.get(
                                playerIndex);

                double peerRatingSum =
                        0.0;

                for (int peer = 0;
                        peer < peerCount;
                        peer++) {

                    double estimate =
                            player.trueSkill()
                                    + noiseDraws
                                            [groupIndex]
                                            [playerIndex]
                                            [peer]
                                    * noiseStandardDeviation;

                    peerRatingSum +=
                            clamp(
                                    estimate);
                }

                double peerRating =
                        peerRatingSum
                                / peerCount;

                errors.add(
                        absoluteError(
                                peerRating,
                                player.trueSkill()));
            }
        }

        return errors;
    }

    private static void printResults(
            List<ExperimentResult> results) {

        System.out.println();

        System.out.println(
                "===== APP RATING VS PEER RATING EXPERIMENT =====");

        System.out.println(
                "Seed sets: "
                        + NUMBER_OF_SEED_SETS);

        System.out.println(
                "Groups per seed set: "
                        + NUMBER_OF_GROUPS);

        System.out.println(
                "Players per group: "
                        + PLAYERS_PER_GROUP);

        for (int roundsPerGame
                : ROUND_COUNTS) {

            System.out.println();

            System.out.println(
                    "############################################");

            System.out.println(
                    "ROUNDS PER GAME: "
                            + roundsPerGame);

            System.out.println(
                    "############################################");

            for (int peerCount
                    : PEER_COUNTS) {

                for (double peerNoise
                        : PEER_NOISE_STDDEVS) {

                    System.out.println();

                    System.out.printf(
                            Locale.US,
                            "===== %d PEER(S), NOISE STDDEV %.2f =====%n",
                            peerCount,
                            peerNoise);

                    System.out.println(
                            "Games | App MAE | Peer MAE | Better");

                    for (int checkpoint
                            : CHECKPOINTS) {

                        double appMae =
                                meanAppMae(
                                        results,
                                        roundsPerGame,
                                        peerCount,
                                        peerNoise,
                                        checkpoint);

                        double peerMae =
                                meanPeerMae(
                                        results,
                                        roundsPerGame,
                                        peerCount,
                                        peerNoise,
                                        checkpoint);

                        String better =
                                determineBetter(
                                        appMae,
                                        peerMae);

                        System.out.printf(
                                Locale.US,
                                "%5d | %.4f  | %.4f   | %s%n",
                                checkpoint,
                                appMae,
                                peerMae,
                                better);
                    }

                    double finalAppMae =
                            meanAppMae(
                                    results,
                                    roundsPerGame,
                                    peerCount,
                                    peerNoise,
                                    300);

                    double finalPeerMae =
                            meanPeerMae(
                                    results,
                                    roundsPerGame,
                                    peerCount,
                                    peerNoise,
                                    300);

                    System.out.println(
                            "At 300 games: "
                                    + determineBetter(
                                            finalAppMae,
                                            finalPeerMae)
                                    + " has lower MAE.");
                }
            }
        }

        System.out.println();

        System.out.println(
                "================================================");
    }

    private static String determineBetter(
            double appMae,
            double peerMae) {

        if (appMae < peerMae) {
            return "APP";
        }

        if (peerMae < appMae) {
            return "PEER";
        }

        return "TIE";
    }

    private static double meanAppMae(
            List<ExperimentResult> results,
            int roundsPerGame,
            int peerCount,
            double peerNoise,
            int checkpoint) {

        return results.stream()
                .filter(result ->
                        result.roundsPerGame()
                                == roundsPerGame
                                && result.peerCount()
                                        == peerCount
                                && Double.compare(
                                        result.peerNoiseStdDev(),
                                        peerNoise) == 0
                                && result.ratedGames()
                                        == checkpoint)
                .mapToDouble(
                        ExperimentResult::appMae)
                .average()
                .orElse(0.0);
    }

    private static double meanPeerMae(
            List<ExperimentResult> results,
            int roundsPerGame,
            int peerCount,
            double peerNoise,
            int checkpoint) {

        return results.stream()
                .filter(result ->
                        result.roundsPerGame()
                                == roundsPerGame
                                && result.peerCount()
                                        == peerCount
                                && Double.compare(
                                        result.peerNoiseStdDev(),
                                        peerNoise) == 0
                                && result.ratedGames()
                                        == checkpoint)
                .mapToDouble(
                        ExperimentResult::peerMae)
                .average()
                .orElse(0.0);
    }

    private static Path writeCsv(
            List<ExperimentResult> results)
            throws IOException {

        Path directory =
                Path.of(
                        "experiment-results");

        Files.createDirectories(
                directory);

        Path output =
                directory.resolve(
                        "app-rating-vs-peer-rating.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        output,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "seedSet,"
                            + "roundsPerGame,"
                            + "peerCount,"
                            + "peerNoiseStdDev,"
                            + "ratedGames,"
                            + "appObservations,"
                            + "peerObservations,"
                            + "appMae,"
                            + "peerMae,"
                            + "peerMinusAppMae");

            writer.newLine();

            for (ExperimentResult result
                    : results) {

                writer.write(
                        String.format(
                                Locale.US,
                                "%d,%d,%d,%.2f,%d,%d,%d,%.6f,%.6f,%.6f",
                                result.seedSet(),
                                result.roundsPerGame(),
                                result.peerCount(),
                                result.peerNoiseStdDev(),
                                result.ratedGames(),
                                result.appObservations(),
                                result.peerObservations(),
                                result.appMae(),
                                result.peerMae(),
                                result.peerMae()
                                        - result.appMae()));

                writer.newLine();
            }
        }

        return output;
    }

    private static double average(
            List<Double> values) {

        return values.stream()
                .mapToDouble(
                        Double::doubleValue)
                .average()
                .orElse(0.0);
    }

    private static double absoluteError(
            double value,
            double trueSkill) {

        return Math.abs(
                value
                        - trueSkill);
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

            this.id =
                    id;

            this.name =
                    name;

            this.trueSkill =
                    trueSkill;

            this.selfRating =
                    selfRating;

            this.attendanceProbability =
                    attendanceProbability;

            this.appRating =
                    selfRating;

            this.ratedGames =
                    0;
        }
    }

    private record ExperimentResult(
            int seedSet,
            int roundsPerGame,
            int peerCount,
            double peerNoiseStdDev,
            int ratedGames,
            int appObservations,
            int peerObservations,
            double appMae,
            double peerMae) {
    }
}