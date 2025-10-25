
export default function chunkQuestion(data) {
  const mainChunk = [];
  let questionChunk = [];
  let num = 0;       // counts normal-sized questions
  let largeElem = 0; // flag for one large element per chunk
  console.log(data,"data chuckquestion");
  data.forEach(section => {
    section = Array.isArray(section) ? section : [section];
    section.forEach(sectionQuestion => {
      sectionQuestion.questions?.forEach(question => {
        const optionsLength = question.options?.length || 0;

        if (question.type === 'select' || question.type === 'checkbox') {
          if (optionsLength <= 5) {
            questionChunk.push(question);
            num++;
          } else if (optionsLength > 5 && optionsLength <= 8) {
            if (largeElem === 0) {
              questionChunk.push(question);
              largeElem = 1;
            } else {
              // already have a large element, push this question as its own chunk
              mainChunk.push([question]);
            }
          } else {
            // options > 8, push as single chunk
            mainChunk.push([question]);
          }
        } else {
          // other types, just add
          questionChunk.push(question);
          num++;
        }

        // Check if chunk size reached 5 normal questions or has 1 large + up to 4 normal
        if (num >= 5) {
          mainChunk.push(questionChunk);
          questionChunk = [];
          num = 0;
          largeElem = 0;
        }
      });
    });
  });

  // push any remaining questions
  if (questionChunk.length) {
    mainChunk.push(questionChunk);
  }

  console.log(mainChunk, "mainChunk");
  return mainChunk
}


