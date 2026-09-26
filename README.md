<div align="center">

# ⚽ KickSplit

### Smart team balancing for amateur football groups

A full-stack platform for organizing recurring football games, generating balanced teams, tracking results, and learning player ratings over time.

</div>

<p align="center">
  <img src="docs/images/kicksplit-hero.png" alt="KickSplit Hero" width="900"/>
</p>

---

> **README assets:** Keep the `docs/images/` and `docs/data/` folders in the repository together with this README so that the figures and experiment-data links render correctly on GitHub.

## Table of Contents

1. [Introduction](#1-introduction)
2. [KickSplit System](#2-kicksplit-system)
3. [Architecture & Implementation](#3-architecture--implementation)
4. [Algorithmic Design](#4-algorithmic-design)
5. [Evaluation](#5-evaluation)
6. [Evaluation Metrics](#6-evaluation-metrics)
7. [Results](#7-results)
8. [Discussion](#8-discussion)
9. [Limitations & Future Work](#9-limitations--future-work)
10. [Conclusions](#10-conclusions)

---

# 1. Introduction

Organizing recurring amateur football games involves several tasks that are often handled separately and manually. Players need to know when a game is planned, indicate whether they are available, decide who participates, divide the participants into teams, and later keep track of results and player performance.

The motivation for KickSplit came from the way these tasks were handled in my own football group. Player registration was managed through WhatsApp, team selection was discussed manually in the group chat, and there was no single place that maintained the players, games, team assignments, results, and changing perceptions of player level. Other amateur football groups may use different processes, but similar problems can arise when group management is spread across messaging applications, personal knowledge, and manual decisions.

One particularly important challenge is team formation. Even after the participating players are known, dividing them into balanced teams is not trivial. Manual selection is subjective, depends on the people creating the teams, and becomes more difficult when the participating players change from one game to another.

KickSplit was developed as a web-based system that brings these needs into one place. The system supports football-group management, game creation, player availability, guest players, balanced team proposals, voting between proposals, game results, history, player statistics, and ratings. Its central algorithmic component uses player ratings to generate several balanced three-team proposals.

The system also maintains a dynamic **App Rating** for each player within a group. The rating begins from the player's self-rating and is updated over time using game results. This allows future team generation to use information accumulated from previous games rather than relying only on the initial subjective estimate.

Alongside the development of the complete client-server system, the project evaluates several algorithmic questions:

- Does KickSplit generate more balanced teams than random splitting?
- Can the App Rating move toward a player's underlying skill level over repeated games?
- How does the App Rating compare with ratings provided by other players?

The project therefore combines software-system development with algorithmic design and experimental evaluation, with the goal of creating a practical platform for amateur football groups while also examining the behavior and limitations of its team-balancing and rating mechanisms.

---

# 2. KickSplit System

KickSplit is designed as a complete workflow for recurring amateur football groups. Rather than treating team balancing as an isolated task, the system manages the process from group creation and game planning through team generation, voting, result recording, and player statistics.

## 2.1 Users and Groups

Users create an account and can either create a football group or join an existing one through an invitation link. A user may belong to multiple groups.

Player ratings are maintained per group rather than globally, since the relative level of a player may differ between different groups. Each member initially provides a self-rating, which serves as the starting point for later team generation and rating updates.

## 2.2 Game Planning and Availability

A group can create proposed game days, and members independently indicate whether they are available for each game. Players who are marked as available are considered when teams are generated.

The system also supports guest players who do not have an account. Guests are associated only with a specific game and are assigned a temporary rating by the user who adds them.

## 2.3 Team Proposals and Voting

Once the set of participants is known, KickSplit generates up to three balanced team proposals. Each proposal divides the participants into three teams with sizes as equal as possible.

The proposals are then presented to the participating players, who can vote for the option they prefer. This combines automatic team generation with a social decision process, rather than forcing a single automatically generated split.

If participants are not satisfied with the available proposals, they can request a new set of teams. Once the required number of requests is reached, the previous proposals and votes are cleared and a new set of proposals is generated.

## 2.4 Results and Game History

After a game is played, the system stores the selected team proposal together with the number of wins achieved by each of the three teams.

Completed games are stored in the group history, allowing past team compositions and results to remain available instead of being lost in chat messages or informal records.

## 2.5 Ratings and Player Statistics

Game results are also used to maintain player statistics and a dynamic **App Rating**. The App Rating starts from the player's initial self-rating and is updated as additional game results are recorded.

The system stores statistics such as the number of games played, wins, and win rate. Groups can also choose whether future team generation should use the original **Self Rating** or the dynamic **App Rating**.

The overall system flow can therefore be summarized as:

```text
Users
→ Groups
→ Games
→ Availability
→ Guests
→ Team Proposals
→ Voting
→ Results
→ History
→ Ratings / Stats
```

---

# 3. Architecture & Implementation

KickSplit was implemented as a client-server web application with a clear separation between the user interface, application logic, and persistent data storage.

```text
              React Frontend
                    |
                 REST API
                    |
              Spring Boot
          /         |          \
     Services   Algorithms   Repositories
                               |
                          PostgreSQL
```

## 3.1 Frontend

The client side of KickSplit was developed using **React** and **Vite**, with **React Router** used for navigation between the different application views.

The frontend is responsible for presenting the system state and user interactions, including authentication, groups, games, availability, team proposals, voting, results, player statistics, and profile management. Data that must persist between users or sessions is retrieved from and sent to the backend through REST API requests.

The application was also configured as a **Progressive Web App (PWA)**, allowing it to provide an application-like experience on mobile devices while remaining a web application.

## 3.2 Backend

The server side was implemented in **Java 21** using **Spring Boot**. The backend contains the main business logic of the system and follows a layered structure based primarily on controllers, services, repositories, and entities.

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Controllers expose the REST endpoints used by the frontend. Services implement the application logic, such as game management, registrations, results, voting, team proposal generation, and rating recalculation. Repositories provide the persistence layer through Spring Data JPA.

The algorithmic components are also executed on the backend. In particular, team generation, balance-score calculation, proposal generation, and App Rating updates are implemented independently from the user interface.

## 3.3 Database and Data Model

Persistent data is stored in a **PostgreSQL** database using JPA entities.

The main data model contains entities representing:

- users and football groups;
- membership of users in groups and their group-specific ratings;
- proposed games and player availability;
- guest players;
- generated team proposals and the players assigned to each team;
- votes on team proposals;
- recorded game results;
- requests for generating new teams.

One important design decision is that player ratings belong to the relationship between a **User** and a **Group**, rather than directly to the user. This reflects the fact that a player's perceived level may be different relative to different groups.

Generated proposals are also persisted rather than being generated independently for every client. As a result, different users viewing the same game see the same proposed teams and the same accumulated votes.

## 3.4 Interaction Between Components

A typical request passes through several layers of the system. For example, when team proposals are requested, the frontend sends the request to the backend API. The backend obtains the relevant participants and ratings from the database, invokes the team-generation algorithm, stores the generated proposals, and returns them to the client.

```text
React UI
   ↓
REST Request
   ↓
Spring Controller
   ↓
Service
   ↓
Team Generation Algorithm
   ↓
Repository / PostgreSQL
   ↓
REST Response
   ↓
React UI
```

A similar flow is used after game results are entered. The result is persisted and the backend invokes the rating-recalculation logic, allowing the updated player information to influence future team generation.

## 3.5 Deployment

KickSplit was developed locally and later deployed as a working web application.

The production frontend is built as a static React application and deployed on **Render**. The Spring Boot backend is deployed separately on **Render**, while the production PostgreSQL database is hosted using **Neon**.

Environment variables are used for production-specific configuration such as the database connection and server settings. This allows the same codebase to operate both with a local PostgreSQL database during development and with the hosted production database after deployment.

---

# 4. Algorithmic Design

The main algorithmic component of KickSplit is responsible for transforming the set of available players into balanced team proposals and, over time, improving the ratings used for future team generation.

The process consists of five main parts: selecting player ratings, generating an initial greedy split, producing multiple candidate proposals, evaluating them using a balance score, and updating player ratings from recorded game results.

## 4.1 Player Ratings

Before generating teams, KickSplit collects all registered players who marked themselves as `AVAILABLE` for the selected game, together with any guest players added to that game.

Each participant is represented by a numerical rating. For registered group members, the group can choose between two rating sources:

- **Self Rating** — the player's original overall rating.
- **App Rating** — the dynamic rating maintained by KickSplit based on previous game results.

Guest players are assigned a rating when they are added to the game.

## 4.2 Greedy Team Split

KickSplit always divides the participating players into three teams.

The algorithm first determines the target size of each team. When the number of participants is not divisible by three, the extra players are distributed so that the difference between team sizes is at most one player.

The players are then sorted from highest rating to lowest rating. Starting with the strongest player, each player is assigned to an eligible team whose current total rating is the lowest.

If several eligible teams have exactly the same current rating sum, one of them is selected randomly.

```text
sort players by rating from highest to lowest

create three empty teams
determine the target size of each team

for each player:
    find teams that are not yet full

    among those teams:
        find the minimum current rating sum

    if several teams have the same minimum:
        choose one randomly

    assign the player to that team
```

The greedy strategy attempts to compensate for strong players early in the process by placing later players into the teams that currently have the lowest accumulated rating.

## 4.3 Proposal Generation

Because the greedy algorithm contains random tie-breaking, a single execution does not necessarily represent the best split that the method can generate.

KickSplit therefore executes the splitting process **100 times** for the same set of participants.

For every generated split, the system calculates a Balance Score. Duplicate proposals are removed before ranking the results. Two proposals are considered identical even if the same three teams appear in a different team order.

The remaining proposals are sorted according to their Balance Score, from lowest to highest, and the system returns up to the **three best generated proposals**.

```text
Available Players
      ↓
100 Greedy Splits
      ↓
Remove Duplicate Proposals
      ↓
Calculate Balance Score
      ↓
Sort by Score
      ↓
Return up to 3 Best Generated Proposals
```

This approach does not guarantee a globally optimal team division. Instead, it searches among multiple randomized greedy solutions and selects the strongest proposals generated during that process.

## 4.4 Balance Score

For a team \(T_i\), its average rating is:

\[
Avg(T_i)=
\frac{\sum_{p \in T_i} Rating(p)}
{|T_i|}
\]

The Balance Score of a proposal is:

\[
BalanceScore =
\max_i Avg(T_i)
-
\min_i Avg(T_i)
\]

A lower Balance Score indicates that the average ratings of the three teams are closer to one another.

Example:

```text
Team 1: 3.20
Team 2: 3.15
Team 3: 3.30

Balance Score = 3.30 - 3.15 = 0.15
```

## 4.5 App Rating

KickSplit maintains a dynamic **App Rating** for registered players. The App Rating begins from the player's initial rating seed and is recalculated from the group's recorded game history.

For each completed game, the system first calculates the current strength of each team as the average App Rating of its players. Guest players contribute the rating that was stored when the proposal was generated.

If the three team strengths are \(S_1\), \(S_2\), and \(S_3\), the expected share of team \(i\) is:

\[
Expected_i =
\frac{S_i}
{S_1+S_2+S_3}
\]

The actual share is calculated from the recorded number of wins:

\[
Actual_i =
\frac{Wins_i}
{Wins_1+Wins_2+Wins_3}
\]

The rating update for every registered player on the team is:

\[
Rating_{new}
=
Rating_{old}
+
K(Actual_i-Expected_i)
\]

The update factor is:

\[
K =
\max
\left(
0.10,\;
\frac{0.8}
{\sqrt{games+1}}
\right)
\]

Early results can therefore cause larger rating changes, while later results produce more moderate updates. The minimum value of **0.10** prevents the learning rate from becoming too small.

Ratings are restricted to:

\[
1.0 \leq AppRating \leq 5.0
\]

All registered players on the same team receive the same rating change for that game because the available result data describes team performance rather than individual contribution.

If no wins are recorded for any team, the system treats the actual share as equal to the expected share, producing no rating change.

```text
Current Ratings
      ↓
Team Generation
      ↓
Game Played
      ↓
Recorded Results
      ↓
App Rating Update
      ↓
Future Team Generation
```

---

# 5. Evaluation

The algorithmic components of KickSplit were evaluated using controlled simulations. The goal was not to reproduce every aspect of real amateur football, but to create repeatable environments in which the team-generation and rating mechanisms could be examined under known conditions.

Three experiments were performed.

## 5.1 Experiment 1 — KickSplit vs. Random Splitting

The first experiment evaluates whether the team-generation algorithm produces more balanced teams than random division.

Synthetic football groups were generated with **20 players per group**, with player ratings in the range of 1 to 5.

Three group types were examined:

- **Balanced** — relatively small variation between player levels.
- **Mixed** — moderate variation.
- **High Variance** — larger differences between stronger and weaker players.

Player attendance varied between game nights.

For every evaluated lineup, KickSplit generated its proposals using the same repeated randomized greedy procedure used by the application.

The baseline consisted of **1,000 random team splits for each lineup**, whose Balance Scores were averaged.

```text
60 simulated groups
20 players per group
20 game nights per group
1,000 random splits per lineup
Random seed: 42
Total evaluated lineups: 1,200
```

The comparison was:

```text
Best generated KickSplit proposal
                 vs.
Average Balance Score of random splitting
```

## 5.2 Experiment 2 — App Rating Learning Dynamics

The second experiment examines whether the App Rating can learn from repeated game results.

Each simulated player was assigned a hidden **True Skill** value. The rating algorithm never receives this value directly.

A player's initial Self Rating was generated as a noisy estimate of True Skill. Game outcomes were influenced by team True Skill, while future team generation and expected-result calculations used the current App Ratings.

```text
True Skill
     ↓
Noisy Self Rating
     ↓
Initial App Rating
     ↓
Team Generation
     ↓
Simulated Game Results
     ↓
App Rating Update
     ↓
Future Team Generation
```

To study result noise, the experiment was repeated with:

```text
5 rounds per game
10 rounds per game
20 rounds per game
50 rounds per game
```

Different update-rate strategies were also evaluated, including several minimum values for \(K\):

```text
0.05
0.10
0.15
0.20
```

The final robustness comparison used several independent seed sets and deterministic seeded versions of the randomized splitting procedure to ensure reproducible parameter comparisons.

Two individual players were also tracked as illustrative cases:

```text
Strong player:
True Skill = 4.8
Initial Rating = 4.0

Weak player:
True Skill = 2.0
Initial Rating = 2.6
```

## 5.3 Experiment 3 — App Rating vs. Peer Rating

The third experiment compares App Rating with ratings produced by simulated peer evaluators.

Peer ratings were generated by adding controlled noise to a player's hidden True Skill.

Three numbers of peer evaluators were tested:

```text
1 peer
3 peers
5 peers
```

Three peer-noise levels were tested:

```text
Standard deviation = 0.4
Standard deviation = 0.8
Standard deviation = 1.2
```

When several peers rated the same player, their ratings were averaged.

The App Rating was evaluated with **5, 10, 20, and 50 rounds per game**, with measurements taken after:

```text
0, 5, 10, 20, 50, 100, and 300 rated games
```

The experiment used **five independent seed sets**, with **20 groups of 20 players** in each seed set.

The Peer Rating model is intentionally idealized: peer errors are independent and centered around True Skill, without shared social bias, reputation effects, anchoring, or systematic disagreement.

## 5.4 Interpretation of the Simulations

The simulations provide a controlled environment in which hidden skill, initial rating error, result noise, and repeated games can be varied independently.

They should not be interpreted as proof that real football groups behave exactly like the simulated population.

The purpose of the experiments is to evaluate the internal behavior of the algorithms under reasonable and reproducible assumptions rather than to create conditions in which KickSplit is guaranteed to outperform alternative methods.

---

# 6. Evaluation Metrics

Three main metrics were used.

## 6.1 Balance Score

\[
BalanceScore =
\max_i Avg(T_i)
-
\min_i Avg(T_i)
\]

Lower values indicate more balanced teams.

## 6.2 Improvement over Random Splitting

\[
Improvement(\%) =
\frac{
RandomScore-KickSplitScore
}{
RandomScore
}
\times 100
\]

A larger positive value indicates greater improvement over the random baseline.

## 6.3 Mean Absolute Error

Experiments 2 and 3 use **Mean Absolute Error (MAE)** to measure rating accuracy:

\[
MAE =
\frac{1}{N}
\sum_{i=1}^{N}
|EstimatedRating_i-TrueSkill_i|
\]

Lower MAE indicates that the estimated ratings are closer to the hidden True Skill values.

Because MAE is measured on the same 1–5 rating scale, it also has a direct interpretation. For example, an MAE of **0.40** means that the estimated rating differs from True Skill by about **0.40 rating points on average**.

---

# 7. Results

## 7.1 Experiment 1 — KickSplit vs. Random Splitting

Across all **1,200 simulated lineups**, the best generated KickSplit proposal achieved a lower Balance Score than the random-splitting baseline.

| Method | Mean Balance Score |
|---|---:|
| KickSplit | 0.173 |
| Random Splitting | 0.586 |

The average relative improvement was approximately **70.2%**, with a median improvement of approximately **67.5%**.

| Group Type | KickSplit | Random | Mean Improvement |
|---|---:|---:|---:|
| Balanced | 0.081 | 0.259 | 68.8% |
| Mixed | 0.177 | 0.614 | 70.9% |
| High Variance | 0.260 | 0.885 | 70.8% |

<p align="center">
  <img src="docs/images/experiment1_balance_comparison.png" alt="KickSplit vs Random Balance Comparison" width="760"/>
</p>

<p align="center"><em>Figure 1: Mean Balance Score of the best generated KickSplit proposal compared with the random-splitting baseline.</em></p>

**Summary data:** [Experiment 1 CSV](docs/data/experiment1_summary.csv)

The absolute Balance Score increased as player-rating variation increased, while the relative improvement over random splitting remained close to 70% across all three group types.

## 7.2 Experiment 2 — App Rating Learning Dynamics

### Initial Behavior

In the initial 5-round experiment, population-level App Rating error did not improve.

| Rated Games | App Rating MAE |
|---:|---:|
| 0 | 0.454 |
| 5 | 0.479 |
| 10 | 0.487 |
| 20 | 0.487 |
| 40 | 0.485 |

This showed that repeated rating updates alone do not guarantee greater accuracy.

The tracked strong player moved from **4.0** toward a True Skill of **4.8**, ending at approximately **4.772** after 69 rated games.

The tracked weak player started at **2.6** with a True Skill of **2.0**, but ended at approximately **2.964** after 71 rated games.

<p align="center">
  <img src="docs/images/experiment2_player_trajectories.png" alt="App Rating Player Trajectories" width="760"/>
</p>

<p align="center"><em>Figure 2: Example App Rating trajectories for a simulated strong player and weak player.</em></p>

### Effect of Result Noise

At 40 rated games:

| Rounds per Game | MAE |
|---:|---:|
| 5 | 0.477 |
| 10 | 0.439 |
| 20 | 0.431 |
| 50 | 0.421 |

<p align="center">
  <img src="docs/images/experiment2_noise_sensitivity.png" alt="App Rating Noise Sensitivity" width="760"/>
</p>

<p align="center"><em>Figure 3: App Rating MAE over repeated games for different numbers of simulated rounds per game.</em></p>

More informative game results produced more accurate long-term ratings.

### K-Factor Robustness

After 300 rated games:

| Rounds per Game | Original K | K with 0.10 Floor |
|---:|---:|---:|
| 5 | 0.453 | 0.449 |
| 10 | 0.412 | 0.395 |
| 20 | 0.391 | 0.374 |
| 50 | 0.383 | 0.356 |

<p align="center">
  <img src="docs/images/experiment2_k_robustness.png" alt="K Factor Robustness" width="760"/>
</p>

<p align="center"><em>Figure 4: Mean App Rating error using the original decreasing-K strategy and the selected K = 0.10 floor.</em></p>

**Summary data:** [Experiment 2 CSV](docs/data/experiment2_report_summary.csv)

The final production implementation therefore uses:

\[
K =
\max
\left(
0.10,\;
\frac{0.8}{\sqrt{games+1}}
\right)
\]

## 7.3 Experiment 3 — App Rating vs. Peer Rating

At **300 rated games**, the App Rating MAE was:

| Rounds per Game | App Rating MAE |
|---:|---:|
| 5 | 0.449 |
| 10 | 0.395 |
| 20 | 0.374 |
| 50 | 0.356 |

Peer Rating MAE was:

| Number of Peers | Noise = 0.4 | Noise = 0.8 | Noise = 1.2 |
|---:|---:|---:|---:|
| 1 | 0.320 | 0.614 | 0.863 |
| 3 | 0.181 | 0.349 | 0.489 |
| 5 | 0.143 | 0.275 | 0.388 |

<p align="center">
  <img src="docs/images/experiment3_app_vs_peer.png" alt="App Rating vs Peer Rating" width="760"/>
</p>

<p align="center"><em>Figure 5: App Rating MAE compared with Peer Rating MAE after 300 rated games.</em></p>

**Summary data:** [Experiment 3 CSV](docs/data/experiment3_app_vs_peer_summary.csv)

With low peer noise, averaging several peer ratings produced highly accurate estimates.

When peer information was sparse or sufficiently noisy, App Rating could achieve lower MAE. For example:

- against **one peer with noise 0.8 or 1.2**, App Rating had lower MAE in all four round conditions;
- against **three peers with noise 1.2**, App Rating had lower MAE in all four round conditions;
- against **five peers with noise 1.2**, App Rating had lower MAE in the 20- and 50-round conditions.

---

# 8. Discussion

## 8.1 Team Balancing Performance

Experiment 1 showed a clear advantage of the KickSplit team-generation process over random splitting.

Players are processed from strongest to weakest and assigned to the weakest eligible team. KickSplit also evaluates 100 randomized greedy attempts rather than relying on only one execution.

This produced a similar relative improvement across balanced, mixed, and high-variance populations.

The results demonstrate effectiveness relative to the tested random baseline, but do not imply that the generated split is globally optimal.

## 8.2 What the Initial App Rating Failure Revealed

The first App Rating experiment produced an important unexpected result: with only five rounds per simulated game, rating accuracy became worse rather than better.

One important reason is that KickSplit receives **team-level feedback rather than individual-level feedback**. Every registered player on a team receives the same rating adjustment even though their individual contributions may differ.

The tracked weak-player case demonstrates this limitation particularly clearly.

Rather than modifying the simulation to force a successful outcome, this result motivated the later noise and K-factor experiments.

## 8.3 Result Noise and Learning Rate

A short game contains substantial randomness. A weaker team may win more often than expected over only a small number of rounds, causing the rating system to interpret noise as evidence about player ability.

Increasing the number of rounds made results more informative and improved rating learning.

This creates a trade-off in \(K\):

- larger \(K\) values correct wrong ratings faster when information is reliable;
- larger \(K\) values also amplify noisy results;
- smaller \(K\) values are more stable;
- excessively small \(K\) values can make long-term correction too slow.

The selected **0.10 minimum K** was therefore chosen as a compromise across different simulated conditions rather than because it was always the best value in every scenario.

## 8.4 App Rating vs. Peer Rating

Neither App Rating nor Peer Rating was universally more accurate.

Several independent, low-noise peer ratings produced a strong estimate of player ability because averaging reduced individual errors.

App Rating became more competitive when peer information was sparse or noisy and when game results contained sufficient information.

The two approaches therefore use different information sources:

```text
Peer Rating
→ direct human evaluations
→ benefits from several reliable evaluators

App Rating
→ repeated observed team results
→ benefits from informative game outcomes
```

The simulated Peer Rating model is favorable to peer evaluation because peer errors are independent and centered around True Skill. Real human ratings may also contain shared bias, reputation effects, anchoring, or limited knowledge.

## 8.5 Overall Interpretation

The experiments suggest a useful distinction between KickSplit's two central algorithmic problems.

For **team generation**, once meaningful ratings are available, the multi-proposal greedy method consistently produces better-balanced teams than the tested random baseline.

For **rating estimation**, the problem is more uncertain. Results contain useful information, but they are indirect observations of individual ability.

App Rating should therefore be treated as an evolving estimate based on game history rather than as an exact measurement of player skill.

---

# 9. Limitations & Future Work

## 9.1 Rating Model Limitations

The current App Rating learns only from team-level results. All registered players on the same team receive the same rating adjustment, even though their individual contributions may differ.

Future versions could incorporate individual performance indicators, player positions, peer feedback, or other signals that distinguish between players within the same team.

## 9.2 Richer Player Representation

The current team-generation process is based primarily on a single overall rating.

Future versions could make greater use of attacking ability, defensive ability, preferred position, goalkeeper availability, or other player attributes. This could allow teams to be balanced not only in overall strength but also in internal structure and playing roles.

## 9.3 Real-World Evaluation

The current experimental evaluation is based on controlled simulations.

Future work could evaluate KickSplit using data collected from real groups over longer periods and examine:

- whether lower Balance Scores are associated with closer real match results;
- how App Ratings evolve in practice;
- whether players agree with the generated proposals.

## 9.4 More Advanced Team-Generation Methods

The current method uses repeated randomized greedy splitting and does not guarantee a globally optimal solution.

Future work could compare it with approaches such as:

- local search;
- simulated annealing;
- integer optimization;
- other heuristic or metaheuristic techniques.

Such comparisons could consider both solution quality and computational cost.

## 9.5 Social and Community Expansion

A broader future direction is to expand KickSplit beyond the management of individual football groups.

Players could maintain richer profiles containing playing history, preferences, positions, and ratings across different groups.

Groups looking for additional players could discover suitable players, while individual players could find groups or games that match their location, availability, and playing level.

This could also support a broader cross-group rating model. Today, ratings are group-specific because player level is relative to the group in which the player participates. In a larger network, information from several groups could potentially be combined to estimate a more general rating that remains meaningful when a player joins a new group.

Such a rating would require careful calibration between groups rather than simply transferring one group's rating directly to another.

In this direction, KickSplit could evolve from a tool for organizing and balancing individual football groups into a broader social platform connecting amateur players, games, and groups.

---

# 10. Conclusions

KickSplit was developed as a complete web-based system for organizing recurring amateur football groups. The project combines practical group-management features, including game planning, player availability, guest players, team proposals, voting, results, history, player statistics, and ratings, within a single platform.

The algorithmic evaluation showed that the team-generation approach consistently produced more balanced teams than the tested random-splitting baseline. Across the simulated lineups, repeated randomized greedy splitting followed by proposal ranking provided a practical method for generating strong team divisions without claiming global optimality.

The App Rating experiments revealed a more complex picture. Game results can provide useful information for refining player ratings over time, especially when the results are sufficiently informative. At the same time, team-level feedback and noisy outcomes limit the precision of individual rating updates. The App Rating should therefore be viewed as an evolving estimate of player ability rather than an exact measurement.

Overall, KickSplit demonstrates how a real software system can combine application development with algorithmic design and experimental evaluation. The project provides a practical foundation for managing amateur football groups while also opening several directions for future work, including richer player models, real-world evaluation, more advanced team-generation methods, and broader social connections between players and groups.

---

<div align="center">

**KickSplit — Organize. Balance. Play.**

</div>
