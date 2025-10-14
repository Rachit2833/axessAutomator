export default function mapResponse(data, response) {
  const actions = response.map(res => {
    const question = findQuestionById(data, res.qn_id);
    if (!question) return null;

    const action = transformQuestionToAction(question, res);
    console.log(action, "action");
    return { qn_id: res.qn_id, action };
  });

  return actions.filter(Boolean); // remove nulls
}


function findQuestionById(data, questionId) {
  for (const sectionArray of data) {
    for (const section of sectionArray) {
      if (!section.questions) continue;

      for (const question of section.questions) {
        if (question.id === questionId) {
          return question;
        }
      }
    }
  }
  return null; // not found
}
function transformQuestionToAction(question, res) {
  if (!question) return null;

  // Checkbox
  if (question.type === 'checkbox') {
    return {
      type: 'click',
      options: question.options
        ?.filter(opt => res?.option_ids?.includes(opt.id)) // keep only matching options
        .map(opt => ({
          type: "click",
          xpath: opt.xpath
        }))
    };
  }


  // Select dropdown
  if (question.type === 'select') {
    return {
      type: 'select',
      xpath: question.xpath,
      options: question.options
        ?.filter(opt => res?.option_ids?.includes(opt.id)) // keep only selected options
        .map(opt => ({
          label: opt.text,
          xpath: opt.xpath
        }))
    };
  }


  // Text or number input
  if (['text', 'number'].includes(question.type)) {
    return {
      type: 'type',
      xpath: question.xpath,
      value:res.value
    };
  }

  return null;
}

