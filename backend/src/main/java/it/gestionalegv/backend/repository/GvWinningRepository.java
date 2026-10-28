package it.gestionalegv.backend.repository;

import it.gestionalegv.backend.model.GvWinning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GvWinningRepository extends JpaRepository<GvWinning, Long> {

    List<GvWinning> findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
            Long tabacchinoId, LocalDateTime start, LocalDateTime end
    );

}
