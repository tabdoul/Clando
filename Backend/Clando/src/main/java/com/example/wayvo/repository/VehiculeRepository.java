package com.example.wayvo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.wayvo.entity.Vehicule;

import java.util.List;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    List<Vehicule> findByConducteurId(Long conducteurId);
    boolean existsByImmatriculation(String immatriculation);
}