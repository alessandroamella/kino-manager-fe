import axios, { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router';
import { getErrorMsg } from '../../types/error';
import { Alert, Button, Skeleton } from '@heroui/react';
import { useTranslation } from 'react-i18next';

const Docs = () => {
  const { id } = useParams();

  const [docMd, setDocMd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { t, i18n } = useTranslation();

  const isFetching = useRef(false);
  useEffect(() => {
    async function fetchDoc() {
      if (!id || isFetching.current) return;
      isFetching.current = true;
      try {
        const { data } = await axios.get(`/v1/static/docs/${id}.md`);
        console.log('data', data);
        setDocMd(data);
      } catch (error) {
        console.error('error', error);
        setError(
          (error as AxiosError)?.response?.status === 404
            ? t('errors.docNotFound')
            : getErrorMsg(error),
        );
      } finally {
        isFetching.current = false;
      }
    }

    fetchDoc();
  }, [id, t]);

  return (
    <div className="mx-4 md:mx-8 flex flex-col gap-8">
      {error && (
        <Alert color="danger" title={t('errors.generic')}>
          {error}
        </Alert>
      )}
      {docMd && i18n.language !== 'it' && (
        <Alert
          isClosable
          color="primary"
          className="w-fit mx-auto"
          title={t('docs.disclaimer')}
        >
          {t('docs.italianDisclaimer')}
          <Button
            as={'a'}
            size="sm"
            variant="bordered"
            className="my-1 mx-auto"
            href={`https://translate.google.it/?hl=it&sl=it&tl=${
              i18n.language
            }&text=${encodeURIComponent(docMd)}`}
          >
            {t('docs.translate')}
          </Button>
          <small className="text-foreground-500 text-small">
            {t('docs.translatedDisclaimer')}
          </small>
        </Alert>
      )}
      {docMd ? (
        <div className="md min-h-[80vh]">
          <ReactMarkdown>{docMd}</ReactMarkdown>
        </div>
      ) : (
        <Skeleton isLoaded={!!error}>
          <div className="w-full h-96" />
        </Skeleton>
      )}
    </div>
  );
};

export default Docs;
