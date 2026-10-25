import { useEffect, type Dispatch, type SetStateAction } from 'react';
import {
  applyPublishCascade,
  replacePypFromGovernanceEvent,
  replaceQuestionsFromGovernanceEvent,
  replaceTestsFromGovernanceEvent,
  upsertRestoredTest,
} from './governanceReducers';
import type { MockTest, PreviousYearPaper, Question } from '../types';

interface GovernanceEventSubscriptionOptions {
  setTests: Dispatch<SetStateAction<MockTest[]>>;
  setQuestions: Dispatch<SetStateAction<Question[]>>;
  setPypPapers: Dispatch<SetStateAction<PreviousYearPaper[]>>;
}

/**
 * Keeps cross-module governance events at the application boundary.
 * Each listener is installed once and removed on unmount.
 */
export function useGovernanceEventSubscriptions({
  setTests,
  setQuestions,
  setPypPapers,
}: GovernanceEventSubscriptionOptions): void {
  useEffect(() => {
    const handleRestored = (event: Event) => {
      const detail = (event as CustomEvent<MockTest>).detail;
      if (detail && detail.id) {
        setTests(previous => upsertRestoredTest(previous, detail));
      }
    };

    const handleCascadePublish = (event: Event) => {
      const detail = (event as CustomEvent<{
        affectedTestIds?: unknown;
        newPublishStatus?: unknown;
      }>).detail;
      if (detail && Array.isArray(detail.affectedTestIds) && typeof detail.newPublishStatus === 'boolean') {
        setTests(previous =>
          applyPublishCascade(previous, detail.affectedTestIds as string[], detail.newPublishStatus as boolean),
        );
      }
    };

    const handleTestsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      setTests(previous => replaceTestsFromGovernanceEvent(detail, previous));
    };

    const handleQuestionsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      setQuestions(previous => replaceQuestionsFromGovernanceEvent(detail, previous));
    };

    const handlePypUpdated = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      setPypPapers(previous => replacePypFromGovernanceEvent(detail, previous));
    };

    const listeners: Array<[string, EventListener]> = [
      ['cgssb-test-restored', handleRestored],
      ['cgssb-governance-publish-cascade', handleCascadePublish],
      ['cgssb-tests-updated', handleTestsUpdated],
      ['cgssb-questions-updated', handleQuestionsUpdated],
      ['cgssb-pyp-updated', handlePypUpdated],
    ];

    listeners.forEach(([eventName, listener]) => {
      window.addEventListener(eventName, listener);
    });

    return () => {
      listeners.forEach(([eventName, listener]) => {
        window.removeEventListener(eventName, listener);
      });
    };
  }, [setTests, setQuestions, setPypPapers]);
}
