package com.ptit.student.repository;

import com.ptit.student.model.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudentStudentCode(String studentCode);
    List<Grade> findByStudentStudentCodeAndSemester(String studentCode, String semester);
}
