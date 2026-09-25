package com.kicksplit.backend.experiments;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

import com.kicksplit.backend.algorithm.PlayerCandidate;
import com.kicksplit.backend.algorithm.TeamProposal;
import com.kicksplit.backend.algorithm.TeamProposalGenerator;

public class AppRatingConvergenceExperiment {

    private static final long SEED = 84L;

    private static final int NUMBER_OF_GROUPS = 60;
    private static final int PLAYERS_PER_GROUP = 20;
    private static final int GAME_NIGHTS = 80;

    /*
     * Each recorded game is represented by several wins
     * distributed among the three teams.
     */
    private static final int ROUNDS_PER_GAME = 5;

    private static final double BASE_K = 0.8;

    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    private static final int[] CHECKPOINTS = {
            0, 5, 10, 20, 40
    };

    private static final Random random =
            new Random(SEED);

    private static final Map<Integer, List<CheckpointObservation>>
            checkpointObservations =
                    new LinkedHashMap<>();

    private static final List<TrajectoryPoint>
            trajectories =
                    new ArrayList<>();

    public static void main(String[] args)
            throws IOException {

        initializeCheckpoints();

        List<List<SimulatedPlayer>> groups =
                generateGroups();

        for (List<SimulatedPlayer> group : groups) {

            recordInitialErrors(group);

            simulateGroupSeason(group);
        }

        printSummary();

        Path convergenceCsv =
                writeConvergenceCsv();

        Path trajectoryCsv =
                writeTrajectoryCsv();

        System.out.println();
        System.out.println(
                "Convergence CSV saved to: "
                        + convergenceCsv.toAbsolutePath());

        System.out.println(
                "Trajectory CSV saved to: "
                        + trajectoryCsv.toAbsolutePath());
    }

    private static void initializeCheckpoints() {

        for (int checkpoint : CHECKPOINTS) {
            checkpointObservations.put(
                    checkpoint,
                    new ArrayList<>());
        }
    }

    private static List<List<SimulatedPlayer>>
            generateGroups() {

        List<List<SimulatedPlayer>> groups =
                new ArrayList<>();

        long nextPlayerId = 1L;

        for (int groupIndex = 0;
                groupIndex < NUMBER_OF_GROUPS;
                groupIndex++) {

            List<SimulatedPlayer> group =
                    new ArrayList<>();

            for (int playerIndex = 0;
                    playerIndex < PLAYERS_PER_GROUP;
                    playerIndex++) {

                String name =
                        "G"
                                + (groupIndex + 1)
                                + "_P"
                                + (playerIndex + 1);

                double trueSkill;
                double selfRating;
                double attendanceProbability;

                /*
                 * Two players in the first group are fixed
                 * for illustrative trajectory graphs.
                 */
                if (groupIndex == 0
                        && playerIndex == 0) {

                    name = "Tracked_Strong";

                    trueSkill = 4.8;
                    selfRating = 4.0;
                    attendanceProbability = 0.90;

                } else if (groupIndex == 0
                        && playerIndex == 1) {

                    name = "Tracked_Weak";

                    trueSkill = 2.0;
                    selfRating = 2.6;
                    attendanceProbability = 0.90;

                } else {

                    trueSkill =
                            generateTrueSkill();

                    selfRating =
                            generateSelfRating(
                                    trueSkill);

                    attendanceProbability =
                            generateAttendanceProbability();
                }

                group.add(
                        new SimulatedPlayer(
                                nextPlayerId++,
                                name,
                                trueSkill,
                                selfRating,
                                attendanceProbability));
            }

            groups.add(group);
        }

        return groups;
    }

    private static double generateTrueSkill() {

        /*
         * Most amateur players are around the middle
         * of the 1-5 scale, with fewer extreme players.
         */
        double trueSkill =
                3.0
                        + random.nextGaussian()
                        * 0.80;

        return clamp(trueSkill);
    }

    private static double generateSelfRating(
            double trueSkill) {

        /*
         * Self ratings are imperfect estimates of ability.
         * The noise may cause both under-rating
         * and over-rating.
         */
        double selfRating =
                trueSkill
                        + random.nextGaussian()
                        * 0.60;

        return clamp(selfRating);
    }

    private static double
            generateAttendanceProbability() {

        /*
         * Stable individual attendance tendency:
         * 60%-90%.
         */
        return 0.60
                + random.nextDouble()
                * 0.30;
    }

    private static void simulateGroupSeason(
            List<SimulatedPlayer> group) {

        Map<Long, SimulatedPlayer> playersById =
                new HashMap<>();

        for (SimulatedPlayer player : group) {
            playersById.put(
                    player.id,
                    player);
        }

        for (int gameNight = 1;
                gameNight <= GAME_NIGHTS;
                gameNight++) {

            List<SimulatedPlayer> available =
                    generateAvailableLineup(group);

            if (available.size() < 6) {
                gameNight--;
                continue;
            }

            List<List<SimulatedPlayer>> teams =
                    generateKickSplitTeams(
                            available,
                            playersById);

            int[] wins =
                    simulateGameResult(teams);

            applyAppRatingUpdate(
                    teams,
                    wins);

            recordCheckpointErrors(
                    available);

            recordTrackedTrajectories(
                    available);
        }
    }

    private static List<SimulatedPlayer>
            generateAvailableLineup(
                    List<SimulatedPlayer> group) {

        List<SimulatedPlayer> available =
                new ArrayList<>();

        for (SimulatedPlayer player : group) {

            if (random.nextDouble()
                    <= player.attendanceProbability) {

                available.add(player);
            }
        }

        return available;
    }

    private static List<List<SimulatedPlayer>>
            generateKickSplitTeams(
                    List<SimulatedPlayer> available,
                    Map<Long, SimulatedPlayer> playersById) {

        List<PlayerCandidate> candidates =
                new ArrayList<>();

        for (SimulatedPlayer player : available) {

            candidates.add(
                    new PlayerCandidate(
                            player.id,
                            player.name,
                            player.appRating));
        }

        TeamProposalGenerator generator =
                new TeamProposalGenerator();

        List<TeamProposal> proposals =
                generator.generateProposals(
                        candidates);

        if (proposals.isEmpty()) {
            throw new IllegalStateException(
                    "KickSplit generated no proposal.");
        }

        TeamProposal bestProposal =
                proposals.get(0);

        List<List<SimulatedPlayer>> teams =
                new ArrayList<>();

        for (List<PlayerCandidate> candidateTeam
                : bestProposal.getTeams()) {

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

            teams.add(team);
        }

        return teams;
    }

    private static int[] simulateGameResult(
            List<List<SimulatedPlayer>> teams) {

        /*
         * True Skill is used ONLY here.
         *
         * KickSplit never sees it.
         *
         * A stronger team has a higher probability
         * of winning each round, but the result
         * remains stochastic.
         */

        double[] trueStrengths =
                new double[3];

        double totalTrueStrength = 0.0;

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            trueStrengths[teamIndex] =
                    calculateTrueTeamStrength(
                            teams.get(teamIndex));

            totalTrueStrength +=
                    trueStrengths[teamIndex];
        }

        int[] wins = new int[3];

        for (int round = 0;
                round < ROUNDS_PER_GAME;
                round++) {

            double draw =
                    random.nextDouble()
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

    private static double
            calculateTrueTeamStrength(
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

        /*
         * This mirrors the production
         * RatingRecalculationService logic.
         */

        double[] estimatedStrengths =
                new double[3];

        double totalEstimatedStrength = 0.0;

        for (int teamIndex = 0;
                teamIndex < 3;
                teamIndex++) {

            estimatedStrengths[teamIndex] =
                    calculateEstimatedTeamStrength(
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

            /*
             * Every registered player on the team
             * receives the same team-level change,
             * exactly like the production algorithm.
             */
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

    private static double
            calculateEstimatedTeamStrength(
                    List<SimulatedPlayer> team) {

        return team.stream()
                .mapToDouble(
                        player ->
                                player.appRating)
                .average()
                .orElse(0.0);
    }

    private static void recordInitialErrors(
            List<SimulatedPlayer> group) {

        for (SimulatedPlayer player : group) {

            checkpointObservations
                    .get(0)
                    .add(
                            new CheckpointObservation(
                                    absoluteError(
                                            player.appRating,
                                            player.trueSkill),
                                    absoluteError(
                                            player.selfRating,
                                            player.trueSkill)));

            if (isTracked(player)) {

                trajectories.add(
                        new TrajectoryPoint(
                                player.name,
                                0,
                                player.appRating,
                                player.selfRating,
                                player.trueSkill));
            }
        }
    }

    private static void recordCheckpointErrors(
            List<SimulatedPlayer> available) {

        for (SimulatedPlayer player
                : available) {

            for (int checkpoint
                    : CHECKPOINTS) {

                if (checkpoint == 0) {
                    continue;
                }

                if (player.ratedGames
                        == checkpoint) {

                    checkpointObservations
                            .get(checkpoint)
                            .add(
                                    new CheckpointObservation(
                                            absoluteError(
                                                    player.appRating,
                                                    player.trueSkill),
                                            absoluteError(
                                                    player.selfRating,
                                                    player.trueSkill)));
                }
            }
        }
    }

    private static void
            recordTrackedTrajectories(
                    List<SimulatedPlayer> available) {

        for (SimulatedPlayer player
                : available) {

            if (!isTracked(player)) {
                continue;
            }

            trajectories.add(
                    new TrajectoryPoint(
                            player.name,
                            player.ratedGames,
                            player.appRating,
                            player.selfRating,
                            player.trueSkill));
        }
    }

    private static boolean isTracked(
            SimulatedPlayer player) {

        return player.name.equals(
                "Tracked_Strong")
                || player.name.equals(
                        "Tracked_Weak");
    }

    private static void printSummary() {

        System.out.println();
        System.out.println(
                "===== APP RATING CONVERGENCE EXPERIMENT =====");

        System.out.println(
                "Synthetic groups: "
                        + NUMBER_OF_GROUPS);

        System.out.println(
                "Players per group: "
                        + PLAYERS_PER_GROUP);

        System.out.println(
                "Game nights: "
                        + GAME_NIGHTS);

        System.out.println(
                "Rounds per game: "
                        + ROUNDS_PER_GAME);

        System.out.println();

        System.out.println(
                "Games | Observations | App Rating MAE | Self Rating MAE");

        for (int checkpoint
                : CHECKPOINTS) {

            List<CheckpointObservation> observations =
                    checkpointObservations
                            .get(checkpoint);

            double appMae =
                    observations.stream()
                            .mapToDouble(
                                    CheckpointObservation::appError)
                            .average()
                            .orElse(0.0);

            double selfMae =
                    observations.stream()
                            .mapToDouble(
                                    CheckpointObservation::selfError)
                            .average()
                            .orElse(0.0);

            System.out.printf(
                    Locale.US,
                    "%5d | %12d | %14.4f | %15.4f%n",
                    checkpoint,
                    observations.size(),
                    appMae,
                    selfMae);
        }

        System.out.println();

        printTrackedPlayerSummary(
                "Tracked_Strong");

        printTrackedPlayerSummary(
                "Tracked_Weak");

        System.out.println(
                "============================================");
    }

    private static void
            printTrackedPlayerSummary(
                    String playerName) {

        List<TrajectoryPoint> points =
                trajectories.stream()
                        .filter(point ->
                                point.playerName()
                                        .equals(playerName))
                        .toList();

        if (points.isEmpty()) {
            return;
        }

        TrajectoryPoint first =
                points.get(0);

        TrajectoryPoint last =
                points.get(
                        points.size() - 1);

        System.out.println(
                playerName);

        System.out.printf(
                Locale.US,
                "  True Skill:       %.2f%n",
                first.trueSkill());

        System.out.printf(
                Locale.US,
                "  Self Rating:      %.2f%n",
                first.selfRating());

        System.out.printf(
                Locale.US,
                "  Final App Rating: %.4f%n",
                last.appRating());

        System.out.printf(
                Locale.US,
                "  Rated games:      %d%n",
                last.ratedGames());

        System.out.println();
    }

    private static Path writeConvergenceCsv()
            throws IOException {

        Path outputDirectory =
                Path.of("experiment-results");

        Files.createDirectories(
                outputDirectory);

        Path outputFile =
                outputDirectory.resolve(
                        "app-rating-convergence.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        outputFile,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "ratedGames,"
                            + "observations,"
                            + "appRatingMAE,"
                            + "selfRatingMAE,"
                            + "improvementPercent");

            writer.newLine();

            for (int checkpoint
                    : CHECKPOINTS) {

                List<CheckpointObservation> observations =
                        checkpointObservations
                                .get(checkpoint);

                double appMae =
                        observations.stream()
                                .mapToDouble(
                                        CheckpointObservation::appError)
                                .average()
                                .orElse(0.0);

                double selfMae =
                        observations.stream()
                                .mapToDouble(
                                        CheckpointObservation::selfError)
                                .average()
                                .orElse(0.0);

                double improvement =
                        selfMae == 0.0
                                ? 0.0
                                : ((selfMae
                                        - appMae)
                                        / selfMae)
                                        * 100.0;

                writer.write(
                        String.format(
                                Locale.US,
                                "%d,%d,%.6f,%.6f,%.4f",
                                checkpoint,
                                observations.size(),
                                appMae,
                                selfMae,
                                improvement));

                writer.newLine();
            }
        }

        return outputFile;
    }

    private static Path writeTrajectoryCsv()
            throws IOException {

        Path outputDirectory =
                Path.of("experiment-results");

        Files.createDirectories(
                outputDirectory);

        Path outputFile =
                outputDirectory.resolve(
                        "app-rating-trajectories.csv");

        try (BufferedWriter writer =
                Files.newBufferedWriter(
                        outputFile,
                        StandardCharsets.UTF_8)) {

            writer.write(
                    "player,"
                            + "ratedGames,"
                            + "appRating,"
                            + "selfRating,"
                            + "trueSkill");

            writer.newLine();

            for (TrajectoryPoint point
                    : trajectories) {

                writer.write(
                        String.format(
                                Locale.US,
                                "%s,%d,%.6f,%.6f,%.6f",
                                point.playerName(),
                                point.ratedGames(),
                                point.appRating(),
                                point.selfRating(),
                                point.trueSkill()));

                writer.newLine();
            }
        }

        return outputFile;
    }

    private static double absoluteError(
            double value,
            double trueSkill) {

        return Math.abs(
                value - trueSkill);
    }

    private static double clamp(
            double rating) {

        return Math.max(
                MIN_RATING,
                Math.min(
                        MAX_RATING,
                        rating));
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

    private record CheckpointObservation(
            double appError,
            double selfError) {
    }

    private record TrajectoryPoint(
            String playerName,
            int ratedGames,
            double appRating,
            double selfRating,
            double trueSkill) {
    }
}