package com.kicksplit.backend.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    private String name;
    private LocalDate date;
    private LocalTime time;

    private int targetPlayers = 15;

    public Game() {
    }

    public Game(
            Group group,
            User createdBy,
            String name,
            LocalDate date,
            LocalTime time,
            int targetPlayers) {

        this.group = group;
        this.createdBy = createdBy;
        this.name = name;
        this.date = date;
        this.time = time;
        this.targetPlayers = targetPlayers;
    }

    public Long getId() {
        return id;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public int getTargetPlayers() {
        return targetPlayers;
    }

    public void setTargetPlayers(int targetPlayers) {
        this.targetPlayers = targetPlayers;
    }
}