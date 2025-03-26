import {
  Button,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { BiInfoCircle, BiSearch } from 'react-icons/bi';

const CashierShortcutsInfo = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Modal size="2xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('cashier.shortcutsInfo')}
              </ModalHeader>
              <ModalBody>
                <p>
                  Per cercare un articolo, puoi utilizzare la barra di ricerca (
                  <BiSearch className="inline" />) in alto a destra. Puoi
                  cercare per nome, descrizione o categoria.
                </p>
                <p>
                  Una volta inserito il nome, puoi scegliere rapidamente
                  l&apos;articolo desiderato dalla lista dei risultati usando i
                  tasti <strong>freccia</strong> <Kbd keys={['left']} />,{' '}
                  <Kbd keys={['right']} />, <Kbd keys={['up']} /> e{' '}
                  <Kbd keys={['down']} /> sulla tastiera{' '}
                  <i>
                    (
                    <BiInfoCircle className="inline" />: il focus deve essere
                    sulla barra di ricerca, quindi cliccaci sopra se non
                    funziona)
                  </i>
                  .
                </p>
                <p>
                  Per aggiungere un articolo alla vendita, premi il tasto{' '}
                  <strong>Invio</strong> (<Kbd keys={['enter']} />
                  ).
                </p>
                <p>
                  Premi <strong>Tab</strong> (<Kbd keys={['tab']} />) per
                  scegliere il metodo di pagamento, quindi premi di nuovo{' '}
                  <strong>Invio</strong> (<Kbd keys={['enter']} />) per
                  confermare la vendita.
                </p>
                <p>
                  Al prompt di conferma, inserisci l&apos;importo ricevuto se il
                  cliente paga in contanti. Premi <strong>Invio</strong> (
                  <Kbd keys={['enter']} />) per confermare il pagamento e
                  completare la vendita.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t('common.close')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default CashierShortcutsInfo;
