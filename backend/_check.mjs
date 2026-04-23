import('./services/ragService.js')
  .then(() => console.log('ragService.js loads OK'))
  .catch(e => console.error('Load error:', e.message));
