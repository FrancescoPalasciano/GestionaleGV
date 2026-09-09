package it.gestionalegv.backend.repository;

import it.gestionalegv.backend.model.Tabacchino;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TabacchinoRepository extends JpaRepository<Tabacchino, Long> {

    Optional<Tabacchino> findByEmail(String email);

    boolean existsByEmail(String email);
}
