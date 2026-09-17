package it.gestionalegv.backend.service;

import it.gestionalegv.backend.model.GvTransactionLog;
import it.gestionalegv.backend.model.GvWinning;
import it.gestionalegv.backend.model.Tabacchino;
import it.gestionalegv.backend.repository.GvPriceTierRepository;
import it.gestionalegv.backend.repository.GvPurchaseRepository;
import it.gestionalegv.backend.repository.GvSaleRepository;
import it.gestionalegv.backend.repository.GvTransactionLogRepository;
import it.gestionalegv.backend.repository.GvWinningRepository;
import it.gestionalegv.backend.repository.TabacchinoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GvServiceTest {

    private GvWinningRepository winningRepository;
    private GvTransactionLogRepository transactionRepository;
    private GvService service;

    @BeforeEach
    void setUp() {
        GvPriceTierRepository priceTierRepository = mock(GvPriceTierRepository.class);
        GvSaleRepository saleRepository = mock(GvSaleRepository.class);
        winningRepository = mock(GvWinningRepository.class);
        transactionRepository = mock(GvTransactionLogRepository.class);
        GvPurchaseRepository purchaseRepository = mock(GvPurchaseRepository.class);
        TabacchinoRepository tabacchinoRepository = mock(TabacchinoRepository.class);
        service = new GvService(priceTierRepository, saleRepository, winningRepository,
                transactionRepository, purchaseRepository, tabacchinoRepository);
    }

    @Test
    void deletingLegacyWinningLogNeverDeletesWinningWithCoincidentId() {
        Tabacchino owner = tabacchino(1L);
        GvTransactionLog transaction = transaction(owner, "win", null);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));

        service.deleteTransaction(1L, 10L);

        assertTrue(transaction.getDeleted());
        verify(transactionRepository).save(transaction);
        verify(winningRepository, never()).findById(anyLong());
    }

    @Test
    void deletingLinkedWinningLogDeletesOnlyTheRelatedWinning() {
        Tabacchino owner = tabacchino(1L);
        GvTransactionLog transaction = transaction(owner, "win", 42L);
        GvWinning winning = new GvWinning();
        winning.setTabacchino(owner);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));
        when(winningRepository.findById(42L)).thenReturn(Optional.of(winning));

        service.deleteTransaction(1L, 10L);

        assertTrue(winning.getDeleted());
        verify(winningRepository).save(winning);
        verify(winningRepository, never()).findById(10L);
    }

    @Test
    void userCannotDeleteAnotherStoresTransaction() {
        GvTransactionLog transaction = transaction(tabacchino(2L), "win", 42L);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));

        assertThrows(IllegalArgumentException.class, () -> service.deleteTransaction(1L, 10L));
        verify(transactionRepository, never()).save(transaction);
        verify(winningRepository, never()).findById(anyLong());
    }

    private static Tabacchino tabacchino(Long id) {
        Tabacchino tabacchino = new Tabacchino();
        tabacchino.setId(id);
        return tabacchino;
    }

    private static GvTransactionLog transaction(Tabacchino owner, String type, Long relatedId) {
        GvTransactionLog transaction = new GvTransactionLog();
        transaction.setTabacchino(owner);
        transaction.setType(type);
        transaction.setRelatedEntityId(relatedId);
        return transaction;
    }
}
