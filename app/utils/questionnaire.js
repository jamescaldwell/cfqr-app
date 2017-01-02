// @flow
import cfqrData from 'cfqr-data';

const getQuestionsIds = (elements: Object) => {
  let questionsIds = [];
  elements.forEach(element => {
    if (element.id) {
      questionsIds.push(element.id);
    }
    if (element.content) {
      const subContentIds = getQuestionsIds(element.content);
      questionsIds = questionsIds.concat(subContentIds);
    }
    if (element.questions) {
      const subQuestionIds = getQuestionsIds(element.questions);
      questionsIds = questionsIds.concat(subQuestionIds);
    }
  });
  return questionsIds;
};

const getQuestionsFromData = () => {
  const cfqrQuestions = {};
  Object.keys(cfqrData.elements).forEach(qstKey => {
    cfqrQuestions[qstKey] = getQuestionsIds(cfqrData.elements[qstKey]);
  });
  return cfqrQuestions;
};

const validateQuestionnaire = (state: Object) => {
  if (state.questions.length > Object.keys(state.results).length) {
    return false;
  }
  return true;
};

const formatQuestionnaire = (state: Object) => {
  const questionnaireType = state.type;
  const questionsScores = cfqrData.scores[questionnaireType];
  const doc = {};
  // doc._id: autogenerated
  // doc.createdAt: autogenerated
  // doc.updatedAt: autogenerated
  doc.appVersion = process.env.npm_package_version;
  doc.dataVersion = cfqrData.version;
  doc.type = state.type;
  doc.patient = state.patient || null;
  doc.answers = {};
  doc.scores = {};
  const answers = state.results;
  Object.keys(answers).forEach(answerKey => {
    const answer = (typeof answers[answerKey].answer !== 'undefined') ? answers[answerKey].answer : null;
    const answerScore = questionsScores[answerKey];
    if (answerScore) {
      // question w/ score
      doc.answers[answerKey] = answers[answerKey].key;
      doc.scores[answerKey] = answerScore.score[answer];
    } else {
      // open question
      doc[answerKey] = answer;
    }
  });
  return doc;
};

const findMissingAnswers = (questionnaire: Object) => {
  questionnaire.questions.filter(questionId => !questionnaire.results[questionId]);
};

export {
  getQuestionsIds,
  getQuestionsFromData,
  validateQuestionnaire,
  formatQuestionnaire,
  findMissingAnswers
};