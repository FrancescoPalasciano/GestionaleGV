package it.gestionalegv.backend.repository;

import it.gestionalegv.backend.model.GvTransactionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GvTransactionLogRepository extends JpaRepository<GvTransactionLog, Long> {

    List<GvTransactionLog> findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
            Long tabacchinoId, LocalDateTime start, LocalDateTime end
    );

    List<GvTransactionLog> findByTabacchinoIdAndRecordedAtBetweenOrderByRecordedAtDesc(
            Long tabacchinoId, LocalDateTime start, LocalDateTime end
    );

    List<GvTransactionLog> findTop10ByTabacchinoIdAndDeletedFalseOrderByRecordedAtDesc(Long tabacchinoId);

    void deleteByTabacchinoIdAndId(Long tabacchinoId, Long id);
}
