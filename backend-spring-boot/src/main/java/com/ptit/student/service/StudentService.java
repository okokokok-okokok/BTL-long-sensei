package com.ptit.student.service;

import com.ptit.student.model.Grade;
import com.ptit.student.model.Student;
import com.ptit.student.repository.GradeRepository;
import com.ptit.student.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private GradeRepository gradeRepository;

    public Optional<Student> getStudentByCode(String code) {
        return studentRepository.findByStudentCode(code);
    }

    public List<Grade> getStudentGrades(String studentCode, String semester) {
        if (semester != null && !semester.isEmpty() && !"All".equalsIgnoreCase(semester)) {
            return gradeRepository.findByStudentStudentCodeAndSemester(studentCode, semester);
        }
        return gradeRepository.findByStudentStudentCode(studentCode);
    }

    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }
}
