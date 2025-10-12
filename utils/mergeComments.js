export default function mergeExtraTextareas(sections) {
  const sectionArray = Array.isArray(sections) ? sections : [sections];
  return sectionArray.map(section => {
    const mergedQuestions = [];

    for (let i = 0; i < section.questions.length; i++) {
      const current = section.questions[i];
      const previous = mergedQuestions[mergedQuestions.length - 1];

      // If current is a textarea with a label like "Comments" and previous exists
      if (
        current.type === "textarea" &&
        /comments?/i.test(current.question) &&
        previous &&
        section.heading // same section
      ) {
        // merge into previous question as an "extra" field
        previous.comments = {
          question: current.question,
          placeholder: current.placeholder || "",
        };
      } else {
        // push normally
        mergedQuestions.push(current);
      }
    }

    return { ...section, questions: mergedQuestions };
  });
}
