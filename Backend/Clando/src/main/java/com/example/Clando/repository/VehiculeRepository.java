package com.example.Clando.repository;

import com.example.Clando.entity.Vehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    List<Vehicule> findByConducteurId(Long conducteurId);
    boolean existsByImmatriculation(String immatriculation);
}