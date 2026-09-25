package com.kicksplit.backend.experiments;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

import com.kicksplit.backend.algorithm.PlayerCandidate;
import com.kicksplit.backend.algorithm.TeamProposal;
import com.kicksplit.backend.algorithm.TeamProposalGenerator;

public class AppRatingTrajectoryExperiment {

    private static final long POPULATION_SEED = 84L;
    private static final long ATTENDANCE_SEED = 1234L;
    private static final long RESULT_SEED = 5678L;

    private static final int PLAYERS_IN_GROUP = 20;
    private static final int GAME_NIGHTS = 100;
    private static final int MAX_ROUNDS = 50;

    private static final int[] ROUND_COUNTS = {
            5, 20, 50
    };

    private static final double BASE_K = 0.8;
    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    private static final String STRONG_PLAYER =
            "Tracked_Strong";

    private static final String WEAK_PLAYER =
            "Tracked_Weak";

    public static void main(String[] args)
            throws IOException {

        List<PlayerTemplate> templates =
                createTemplateGroup();

        double[][] attendanceDraws =
                generateAttendanceDraws();

        double[][] resultDraws =
                generateResultDraws();

        List<TrajectoryRow> allRows =
                new ArrayList<>();

        for (int roundsPerGame : ROUND_COUNTS) {

            List<SimulatedPlayer> group =
                    createFreshGroup(templates);

            recordInitialRows(
                    group,
                    roundsPerGame,
                    allRows);

            simulateSeason(
                    group,
                    roundsPerGame,
                    attendanceDraws,
                    resultDraws,
                    allRows);
        }

        printSummary(allRows);

        Path csv =
                writeCsv(allRows);

        System.out.println();
        System.out.println(
                "CSV saved to: "
                        + csv.toAbsolutePath());
    }

    private static List<PlayerTemplate>
            createTemplateGroup() {

        Random random =
                new Random(POPULATION_SEED);

        List<PlayerTemplate> group =
                new ArrayList<>();

        for (int index = 0;
                index < PLAYERS_IN_GROUP;
                index++) {

            long id = index + 1L;

            if (index == 0) {

                group.add(
                        new PlayerTemplate(
                                id,
                                STRONG_PLAYER,
                                4.8,
                                4.0,
                                0.90));

                continue;
            }

            if (index == 1) {

                group.add(
                        new PlayerTemplate(
                                id,
                                WEAK_PLAYER,
                                2.0,
                                2.6,
                                0.90));

                continue;
            }

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
                            id,
                            "Player_" + (index + 1),
                            trueSkill,
                            selfRating,
                            attendanceProbability));
        }

        return group;
    }

    private static double[][] generateAttendanceDraws() {

        Random random =
                new Random(ATTENDANCE_SEED);

        double[][] draws =
                new double[GAME_NIGHTS][PLAYERS_IN_GROUP];

        for (int game = 0;
                game < GAME_NIGHTS;
                game++) {

            for (int player = 0;
                    player < PLAYERS_IN_GROUP;
                    player++) {

                draws[game][player] =
                        random.nextDouble();
            }
        }

        return draws;
    }

    private static double[][] generateResultDraws() {

        Random random =
                new Random(RESULT_SEED);

        double[][] draws =
                new double[GAME_NIGHTS][MAX_ROUNDS];

        for (int game = 0;
                game < GAME_NIGHTS;
                game++) {

            for (int round = 0;
                    round < MAX_ROUNDS;
                    round++) {

                draws[game][round] =
                        random.nextDouble();
            }
        }

        return draws;
    }

    private static List<SimulatedPlayer>
            createFreshGroup(
                    List<PlayerTemplate> templates) {

        List<SimulatedPlayer> group =
                new ArrayList<>();

        for (PlayerTemplate template
                : templates) {

            group.add(
                    new SimulatedPlayer(
                            template.id(),
                            template.name(),
                            template.trueSkill(),
                            template.selfRating(),
                            template.attendanceProbability()));
        }

        return group;
    }

    private static void simulateSeason(
            List<SimulatedPlayer> group,
            int roundsPerGame,
            double[][] attendanceDraws,
            double[][] resultDraws,
            List<TrajectoryRow> rows) {

        for (int gameNight = 0;
                gameNight < GAME_NIGHTS;
                gameNight++) {

            List<SimulatedPlayer> available =
                    generateAvailableLineup(
                            group,
                            attendanceDraws[gameNight]);

            if (available.size() < 6) {
                continue;
            }

            List<List<SimulatedPlayer>> teams =
                    generateKickSplitTeams(
                            available);

            int[] wins =
                    simulateGameResult(
                            teams,
                            roundsPerGame,
                            resultDraws[gameNight]);

            applyRatingUpdate(
                    teams,
                    wins,
                    roundsPerGame,
                    gameNight + 1,
                    rows);
        }
    }

    private static List<SimulatedPlayer>
            generateAvailableLineup(
                    List<SimulatedPlayer> group,
                    double[] attendanceDraws) {

        List<SimulatedPlayer> available =
                new ArrayList<>();

        for (int index = 0;
                index < group.size();
                index++) {

            SimulatedPlayer player =
                    group.get(index);

            if (attendanceDraws[index]
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
                new HashMap<>();

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
            int roundsPerGame,
            double[] resultDraws) {

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
                    resultDraws[round];

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

    private static double
            calculateEstimatedStrength(
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
            int roundsPerGame,
            int gameNight,
            List<TrajectoryRow> rows) {

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

                double ratingBefore =
                        player.appRating;

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

                if (isTracked(player)) {

                    rows.add(
                            new TrajectoryRow(
                                    roundsPerGame,
                                    gameNight,
                                    player.name,
                                    player.ratedGames,
                                    ratingBefore,
                                    expectedShare,
                                    actualShare,
                                    change,
                                    player.appRating,
                                    player.selfRating,
                                    player.trueSkill,
                                    Math.abs(
                                            player.appRating
                                                    - player.trueSkill)));
                }
            }
        }
    }

    private static void recordInitialRows(
            List<SimulatedPlayer> group,
            int roundsPerGame,
            List<TrajectoryRow> rows) {

        for (SimulatedPlayer player : group) {

            if (!isTracked(player)) {
                continue;
            }

            rows.add(
                    new TrajectoryRow(
                            roundsPerGame,
                            0,
                            player.name,
                            0,
                            player.appRating,
                            Double.NaN,
                            Double.NaN,
                            0.0,
                            player.appRating,
                            player.selfRating,
                            player.trueSkill,
                            Math.abs(
                                    player.appRating
                                            - player.trueSkill)));
        }
    }

    private static boolean isTracked(
            SimulatedPlayer player) {

        return player.name.equals(
                STRONG_PLAYER)
                || player.name.equals(
                        WEAK_PLAYER);
    }

    private static void printSummary(
            List<TrajectoryRow> rows) {

        System.out.println();
        System.out.println(
                "===== APP RATING PLAYER TRAJECTORIES =====");

        for (int rounds : ROUND_COUNTS) {

            System.out.println();
            System.out.println(
                    "----- "
                            + rounds
                            + " ROUNDS PER GAME -----");

            printPlayerSummary(
                    rows,
                    rounds,
                    STRONG_PLAYER);

            printPlayerSummary(
                    rows,
                    rounds,
                    WEAK_PLAYER);
        }

        System.out.println();
        System.out.println(
                "==========================================");
    }

    private static void printPlayerSummary(
            List<TrajectoryRow> rows,
            int rounds,
            String playerName) {

        List<TrajectoryRow> playerRows =
                rows.stream()
                        .filter(row ->
                                row.roundsPerGame()
                                        == rounds)
                        .filter(row ->
                                row.player()
                                        .equals(playerName))
                        .toList();

        if (playerRows.isEmpty()) {
            return;
        }

        TrajectoryRow first =
                playerRows.get(0);

        TrajectoryRow last =
                playerRows.get(
                        playerRows.size() - 1);

        double earlyPeak =
                playerRows.stream()
                        .filter(row ->
                                row.ratedGames() <= 10)
                        .mapToDouble(
                                TrajectoryRow::appRatingAfter)
                        .max()
                        .orElse(
                                first.appRatingAfter());

        double earlyMinimum =
                playerRows.stream()
                        .filter(row ->
                                row.ratedGames() <= 10)
                        .mapToDouble(
                                TrajectoryRow::appRatingAfter)
                        .min()
                        .orElse(
                                first.appRatingAfter());

        System.out.println(playerName);

        System.out.printf(
                Locale.US,
                "  True Skill:        %.2f%n",
                first.trueSkill());

        System.out.printf(
                Locale.US,
                "  Self Rating:       %.2f%n",
                first.selfRating());

        System.out.printf(
                Locale.US,
                "  First-10 minimum:  %.4f%n",
                earlyMinimum);

        System.out.printf(
                Locale.US,
                "  First-10 maximum:  %.4f%n",
                earlyPeak);

        System.out.printf(
                Locale.US,
                "  Final App Rating:  %.4f%n",
                last.appRatingAfter());

        System.out.printf(
                Locale.US,
                "  Final error:       %.4f%n",
                last.errorAfter());

        System.out.printf(
                Locale.US,
                "  Rated games:       %d%n",
                last.ratedGames());

        System.out.println();
    }

    private static Path writeCsv(
            List<TrajectoryRow> rows)
            throws IOException {

        Path directory =
                Path.of("experiment-results");

        Files.createDirectories(
                directory);

        Path output =
                directory.resolve(
                        "app-rating-player-trajectories.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        output,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "roundsPerGame,"
                            + "gameNight,"
                            + "player,"
                            + "ratedGames,"
                            + "appRatingBefore,"
                            + "expectedShare,"
                            + "actualShare,"
                            + "change,"
                            + "appRatingAfter,"
                            + "selfRating,"
                            + "trueSkill,"
                            + "errorAfter");

            writer.newLine();

            for (TrajectoryRow row : rows) {

                writer.write(
                        String.format(
                                Locale.US,
                                "%d,%d,%s,%d,%.6f,%s,%s,%.6f,%.6f,%.6f,%.6f,%.6f",
                                row.roundsPerGame(),
                                row.gameNight(),
                                row.player(),
                                row.ratedGames(),
                                row.appRatingBefore(),
                                optionalDouble(
                                        row.expectedShare()),
                                optionalDouble(
                                        row.actualShare()),
                                row.change(),
                                row.appRatingAfter(),
                                row.selfRating(),
                                row.trueSkill(),
                                row.errorAfter()));

                writer.newLine();
            }
        }

        return output;
    }

    private static String optionalDouble(
            double value) {

        if (Double.isNaN(value)) {
            return "";
        }

        return String.format(
                Locale.US,
                "%.6f",
                value);
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

            this.appRating =
                    selfRating;

            this.ratedGames = 0;
        }
    }

    private record TrajectoryRow(
            int roundsPerGame,
            int gameNight,
            String player,
            int ratedGames,
            double appRatingBefore,
            double expectedShare,
            double actualShare,
            double change,
            double appRatingAfter,
            double selfRating,
            double trueSkill,
            double errorAfter) {
    }
}