package com.example.Clando.controller;

import com.example.Clando.dtos.request.PaiementRequest;
import com.example.Clando.dtos.response.PaiementResponse;
import com.example.Clando.service.PaiementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private final PaiementService paiementService;

    public PaiementController(PaiementService paiementService) {
        this.paiementService = paiementService;
    }
    
    @PostMapping
    public ResponseEntity<PaiementResponse> creer(@Valid @RequestBody PaiementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paiementService.creer(request));
    }

    @GetMapping
    public ResponseEntity<List<PaiementResponse>> getAll() {
        return ResponseEntity.ok(paiementService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaiementResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.getById(id));
    }

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<PaiementResponse> getByReservation(@PathVariable Long reservationId) {
        return ResponseEntity.ok(paiementService.getByReservation(reservationId));
    }
}