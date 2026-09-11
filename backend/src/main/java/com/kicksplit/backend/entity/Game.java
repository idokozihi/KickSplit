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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "games")

public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id")

    private Group group;
    private String name;

    private LocalDate date;
    private LocalTime time;

    private int targetPlayers = 15;

    public Game() {
    }

    public Game(Group group, String name, LocalDate date, LocalTime time, int targetPlayers) {
        this.group = group;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

}
