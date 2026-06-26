package com.example.Clando.controller;

import com.example.Clando.dtos.request.VehiculeRequest;
import com.example.Clando.dtos.response.VehiculeResponse;
import com.example.Clando.service.VehiculeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vehicules")
public class VehiculeController {

    private final VehiculeService vehiculeService;

    public VehiculeController(VehiculeService vehiculeService) {
        this.vehiculeService = vehiculeService;
    }

    @PostMapping
    public ResponseEntity<VehiculeResponse> creer(@Valid @RequestBody VehiculeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehiculeService.creer(request));
    }

    @GetMapping
    public ResponseEntity<List<VehiculeResponse>> getAll() {
        return ResponseEntity.ok(vehiculeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehiculeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.getById(id));
    }

    @GetMapping("/conducteur/{conducteurId}")
    public ResponseEntity<List<VehiculeResponse>> getByConducteur(@PathVariable Long conducteurId) {
        return ResponseEntity.ok(vehiculeService.getByConducteur(conducteurId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehiculeResponse> modifier(@PathVariable Long id,
                                                      @Valid @RequestBody VehiculeRequest request) {
        return ResponseEntity.ok(vehiculeService.modifier(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        vehiculeService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}