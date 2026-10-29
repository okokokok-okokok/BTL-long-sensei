package com.ptit.student.controller;

import com.ptit.student.model.Grade;
import com.ptit.student.model.Student;
import com.ptit.student.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping("/{studentCode}")
    public ResponseEntity<Student> getStudentProfile(@PathVariable String studentCode) {
        return studentService.getStudentByCode(studentCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{studentCode}/grades")
    public ResponseEntity<List<Grade>> getStudentGrades(
            @PathVariable String studentCode,
            @RequestParam(required = false) String semester) {
        List<Grade> grades = studentService.getStudentGrades(studentCode, semester);
        return ResponseEntity.ok(grades);
    }
}
