// English text for course.js. Only the fields written here change in English mode; everything else
// (ids, steps, links, status) comes from course.js. Episodes are matched by id. An array replaces the
// Chinese one wholesale; to change only some fields of objects in an array, key them by index ({0: {...}}).
// Every episode added to course.js gets its English here too.
enOverlay(window.COURSE_META, {
  title: '__COURSE_TITLE_EN__',
  subtitle: '__COURSE_SUBTITLE_EN__',
  mapNote: 'Follows the original course\'s schedule. Each episode explains one core mechanism.',
  footer: 'Paper and assignment links point to the original course site. The videos, lab pages and project map here are self-study aids; all exercises are original.',
});

enOverlay(window.EPISODES, {
  ep01: {title: '__EP01_TITLE_EN__', group: 'Foundations',
    desc: 'A sentence or two on the problem this episode solves and the one intuition to take away.',
    videoTime: 'about 6 min',
    reading: {title: 'Full title of the paper or textbook chapter', time: '2 to 4 hours',
      read: ['Sections 1 and 2: read quickly', 'Section 3: read closely'],
      ask: ['A question you should be able to answer afterwards', 'Another question you should be able to answer']},
    lab: {time: 'about 1 hour', desc: 'Start with the prediction questions: pick an answer first, then run the same scenario in the simulator. Then cause failures yourself.'},
    assignment: {title: 'Do the real assignment', time: '5 to 15 hours',
      notes: ['The same mechanism as the video and the lab; in the assignment you implement it yourself: …']}},
  ep02: {title: 'Title of the next episode', group: 'Foundations'},
});
