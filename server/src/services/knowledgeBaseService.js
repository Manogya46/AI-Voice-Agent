
import {
  knowledgeBase,
  getKnowledgeBaseEntries,
} from '../knowledge-base/knowledgeBase.js';

const normalizeText = (text = '') => text.toLowerCase().trim();

const tokenize = (text) =>
  normalizeText(text)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

export const getRelevantKnowledge = (inputText = '') => {
  const text = normalizeText(inputText);

  if (!text) {
    return [knowledgeBase.customerInfo];
  }

  const inputTokens = new Set(tokenize(text));

  /*
   * The "safety" KB entry is an escalation/reference category.
   * Safety is detected separately by safetyService.js.
   *
   * If we allow "safety" to compete with normal assessment
   * categories here, phrases such as "strange smell" can make
   * the safety entry rank first even when there is no actual
   * safety escalation.
   */
  const assessmentEntries = getKnowledgeBaseEntries().filter(
    (entry) => entry.category !== 'safety'
  );

  const relevant = assessmentEntries
    .map((entry) => {
      const phrases = [
        entry.category,
        entry.title,
        ...(entry.keywords || []),
      ]
        .map(normalizeText)
        .filter(Boolean);

      const searchableTokens = new Set(
        tokenize(phrases.join(' '))
      );

      const tokenScore = [...inputTokens].filter((token) =>
        searchableTokens.has(token)
      ).length;

      const phraseScore =
        phrases.filter((phrase) => text.includes(phrase)).length * 3;

      return {
        entry,
        score: tokenScore + phraseScore,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ entry }) => entry);

  if (relevant.length === 0) {
    return [knowledgeBase.customerInfo];
  }

  return relevant.slice(0, 3);
};

export const getCategoryByName = (categoryName) => {
  return knowledgeBase[categoryName] || knowledgeBase.customerInfo;
};

