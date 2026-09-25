package com.kicksplit.backend.experiments;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Random;

import com.kicksplit.backend.algorithm.BalanceCalculator;
import com.kicksplit.backend.algorithm.PlayerCandidate;
import com.kicksplit.backend.algorithm.RandomTeamSplitter;
import com.kicksplit.backend.algorithm.TeamProposal;
import com.kicksplit.backend.algorithm.TeamProposalGenerator;

public class GreedyVsRandomExperiment {

    private static final long SEED = 42L;

    private static final int NUMBER_OF_GROUPS = 60;
    private static final int PLAYERS_PER_GROUP = 20;
    private static final int GAME_NIGHTS_PER_GROUP = 20;

    private static final int RANDOM_SPLITS_PER_LINEUP = 1000;

    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    private static final Random random = new Random(SEED);

    private static final BalanceCalculator balanceCalculator =
            new BalanceCalculator();

    private static final RandomTeamSplitter randomTeamSplitter =
            new RandomTeamSplitter();

    public static void main(String[] args) throws IOException {

        List<ExperimentResult> results = new ArrayList<>();

        for (int groupIndex = 0;
                groupIndex < NUMBER_OF_GROUPS;
                groupIndex++) {

            GroupType groupType =
                    GroupType.values()[
                            groupIndex % GroupType.values().length
                    ];

            List<SimulatedPlayer> group =
                    generateGroup(
                            groupIndex,
                            groupType);

            for (int gameIndex = 0;
                    gameIndex < GAME_NIGHTS_PER_GROUP;
                    gameIndex++) {

                List<PlayerCandidate> availablePlayers =
                        generateAvailableLineup(group);

                if (availablePlayers.size() < 6) {
                    gameIndex--;
                    continue;
                }

                double kickSplitScore =
                        calculateKickSplitScore(
                                availablePlayers);

                double randomAverageScore =
                        calculateRandomAverageScore(
                                availablePlayers);

                double improvementPercent =
                        randomAverageScore == 0.0
                                ? 0.0
                                : ((randomAverageScore
                                        - kickSplitScore)
                                        / randomAverageScore)
                                        * 100.0;

                results.add(
                        new ExperimentResult(
                                groupIndex + 1,
                                gameIndex + 1,
                                groupType,
                                availablePlayers.size(),
                                kickSplitScore,
                                randomAverageScore,
                                improvementPercent));
            }
        }

        Path csvPath = writeCsv(results);

        printSummary(results);

        System.out.println(
                "CSV saved to: "
                        + csvPath.toAbsolutePath());
    }

    private static List<SimulatedPlayer> generateGroup(
            int groupIndex,
            GroupType groupType) {

        List<SimulatedPlayer> players =
                new ArrayList<>();

        for (int playerIndex = 0;
                playerIndex < PLAYERS_PER_GROUP;
                playerIndex++) {

            double rating =
                    generateRating(groupType);

            double attendanceProbability =
                    generateAttendanceProbability();

            players.add(
                    new SimulatedPlayer(
                            "G" + (groupIndex + 1)
                                    + "_P"
                                    + (playerIndex + 1),
                            rating,
                            attendanceProbability));
        }

        return players;
    }

    private static double generateRating(
            GroupType groupType) {

        double standardDeviation =
                switch (groupType) {

                    case BALANCED -> 0.35;
                    case MIXED -> 0.80;
                    case HIGH_VARIANCE -> 1.20;
                };

        double rating =
                3.0
                        + random.nextGaussian()
                        * standardDeviation;

        return clamp(
                rating,
                MIN_RATING,
                MAX_RATING);
    }

    private static double generateAttendanceProbability() {

        return 0.55
                + random.nextDouble() * 0.35;
    }

    private static List<PlayerCandidate>
            generateAvailableLineup(
                    List<SimulatedPlayer> group) {

        List<PlayerCandidate> available =
                new ArrayList<>();

        for (SimulatedPlayer player : group) {

            if (random.nextDouble()
                    <= player.attendanceProbability()) {

                available.add(
                        new PlayerCandidate(
                                player.name(),
                                player.rating()));
            }
        }

        return available;
    }

    private static double calculateKickSplitScore(
            List<PlayerCandidate> players) {

        TeamProposalGenerator generator =
                new TeamProposalGenerator();

        List<TeamProposal> proposals =
                generator.generateProposals(
                        new ArrayList<>(players));

        if (proposals.isEmpty()) {
            throw new IllegalStateException(
                    "KickSplit generated no proposals.");
        }

        return proposals.get(0)
                .getBalanceScore();
    }

    private static double calculateRandomAverageScore(
            List<PlayerCandidate> players) {

        double scoreSum = 0.0;

        for (int run = 0;
                run < RANDOM_SPLITS_PER_LINEUP;
                run++) {

            List<List<PlayerCandidate>> teams =
                    randomTeamSplitter.split(players);

            scoreSum +=
                    balanceCalculator
                            .calculateBalanceScore(teams);
        }

        return scoreSum
                / RANDOM_SPLITS_PER_LINEUP;
    }

    private static Path writeCsv(
            List<ExperimentResult> results)
            throws IOException {

        Path outputDirectory =
                Path.of("experiment-results");

        Files.createDirectories(
                outputDirectory);

        Path outputFile =
                outputDirectory.resolve(
                        "greedy-vs-random.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        outputFile,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "groupNumber,"
                            + "gameNumber,"
                            + "groupType,"
                            + "availablePlayers,"
                            + "kickSplitScore,"
                            + "randomAverageScore,"
                            + "improvementPercent");

            writer.newLine();

            for (ExperimentResult result : results) {

                writer.write(
                        String.format(
                                Locale.US,
                                "%d,%d,%s,%d,%.6f,%.6f,%.4f",
                                result.groupNumber(),
                                result.gameNumber(),
                                result.groupType(),
                                result.availablePlayers(),
                                result.kickSplitScore(),
                                result.randomAverageScore(),
                                result.improvementPercent()));

                writer.newLine();
            }
        }

        return outputFile;
    }

    private static void printSummary(
            List<ExperimentResult> results) {

        System.out.println();
        System.out.println(
                "===== GREEDY VS RANDOM EXPERIMENT =====");

        System.out.println(
                "Synthetic groups: "
                        + NUMBER_OF_GROUPS);

        System.out.println(
                "Players per group: "
                        + PLAYERS_PER_GROUP);

        System.out.println(
                "Game nights per group: "
                        + GAME_NIGHTS_PER_GROUP);

        System.out.println(
                "Evaluated lineups: "
                        + results.size());

        System.out.println();

        printResults(
                "ALL GROUPS",
                results);

        for (GroupType type : GroupType.values()) {

            List<ExperimentResult> typeResults =
                    results.stream()
                            .filter(result ->
                                    result.groupType() == type)
                            .toList();

            printResults(
                    type.name(),
                    typeResults);
        }

        System.out.println(
                "========================================");
    }

    private static void printResults(
            String title,
            List<ExperimentResult> results) {

        double greedyMean =
                results.stream()
                        .mapToDouble(
                                ExperimentResult::kickSplitScore)
                        .average()
                        .orElse(0.0);

        double randomMean =
                results.stream()
                        .mapToDouble(
                                ExperimentResult::randomAverageScore)
                        .average()
                        .orElse(0.0);

        double improvementMean =
                results.stream()
                        .mapToDouble(
                                ExperimentResult::improvementPercent)
                        .average()
                        .orElse(0.0);

        double averagePlayers =
                results.stream()
                        .mapToInt(
                                ExperimentResult::availablePlayers)
                        .average()
                        .orElse(0.0);

        long greedyBetter =
                results.stream()
                        .filter(result ->
                                result.kickSplitScore()
                                        < result.randomAverageScore())
                        .count();

        double greedyBetterPercentage =
                results.isEmpty()
                        ? 0.0
                        : ((double) greedyBetter
                                / results.size())
                                * 100.0;

        double greedyMedian =
                median(
                        results.stream()
                                .map(
                                        ExperimentResult::kickSplitScore)
                                .toList());

        double randomMedian =
                median(
                        results.stream()
                                .map(
                                        ExperimentResult::randomAverageScore)
                                .toList());

        System.out.println(
                "----- " + title + " -----");

        System.out.println(
                "Lineups: "
                        + results.size());

        System.out.printf(
                "Average available players: %.2f%n",
                averagePlayers);

        System.out.printf(
                "KickSplit mean:             %.4f%n",
                greedyMean);

        System.out.printf(
                "Random mean:                %.4f%n",
                randomMean);

        System.out.printf(
                "KickSplit median:           %.4f%n",
                greedyMedian);

        System.out.printf(
                "Random median:              %.4f%n",
                randomMedian);

        System.out.printf(
                "Average improvement:        %.2f%%%n",
                improvementMean);

        System.out.printf(
                "KickSplit better in:         %.2f%%%n",
                greedyBetterPercentage);

        System.out.println();
    }

    private static double median(
            List<Double> values) {

        if (values.isEmpty()) {
            return 0.0;
        }

        List<Double> sorted =
                new ArrayList<>(values);

        sorted.sort(
                Comparator.naturalOrder());

        int middle =
                sorted.size() / 2;

        if (sorted.size() % 2 == 1) {
            return sorted.get(middle);
        }

        return (
                sorted.get(middle - 1)
                        + sorted.get(middle))
                / 2.0;
    }

    private static double clamp(
            double value,
            double min,
            double max) {

        return Math.max(
                min,
                Math.min(max, value));
    }

    private enum GroupType {
        BALANCED,
        MIXED,
        HIGH_VARIANCE
    }

    private record SimulatedPlayer(
            String name,
            double rating,
            double attendanceProbability) {
    }

    private record ExperimentResult(
            int groupNumber,
            int gameNumber,
            GroupType groupType,
            int availablePlayers,
            double kickSplitScore,
            double randomAverageScore,
            double improvementPercent) {
    }
}