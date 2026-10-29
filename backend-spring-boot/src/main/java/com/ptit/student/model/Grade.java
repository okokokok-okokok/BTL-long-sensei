package com.ptit.student.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "grades")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String courseCode;
    private String courseName;
    private Integer credits;

    private Double attendanceGrade;
    private Double midtermGrade;
    private Double examGrade;
    private Double finalGrade;
    private String letterGrade;

    private String semester;
    private String status;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;
}
