package com.kicksplit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
@Table(name = "group_members")
public class GroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Group group;
    private boolean admin;

    private int selfOverallRating;

    private int selfAttackRating;

    private int selfDefenseRating;

    public GroupMember() {
    }

    public GroupMember(
            User user,
            Group group,
            boolean admin,
            int selfOverallRating,
            int selfAttackRating,
            int selfDefenseRating) {

        this.user = user;
        this.group = group;
        this.admin = admin;
        this.selfOverallRating = selfOverallRating;
        this.selfAttackRating = selfAttackRating;
        this.selfDefenseRating = selfDefenseRating;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public int getSelfOverallRating() {
        return selfOverallRating;
    }

    public void setSelfOverallRating(int selfOverallRating) {
        this.selfOverallRating = selfOverallRating;
    }

    public int getSelfAttackRating() {
        return selfAttackRating;
    }

    public void setSelfAttackRating(int selfAttackRating) {
        this.selfAttackRating = selfAttackRating;
    }

    public int getSelfDefenseRating() {
        return selfDefenseRating;
    }

    public void setSelfDefenseRating(int selfDefenseRating) {
        this.selfDefenseRating = selfDefenseRating;
    }

}
