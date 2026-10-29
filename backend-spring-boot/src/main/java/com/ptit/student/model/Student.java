package com.ptit.student.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String studentCode;

    @Column(nullable = false)
    private String name;

    private String email;
    private String major;
    private String studentClass;
    private String faculty;
    private String academicYear;

    private Double cumulativeGpa;
    private Double targetGpa;
    private Integer earnedCredits;
    private Integer requiredCredits;
}
