// public/js/utils.js
// Utility functions for the NGO System SPA

window.barangayNumberToWord = function(barangay) {
  const map = {
    '01': 'Poblacion I',
    '02': 'Poblacion II',
    '03': 'East Poblacion',
    '04': 'Punta Blanca',
    '05': 'Patunan',
    '06': 'Polot',
    '07': 'Dequis',
    '08': 'Palaranan',
    '09': 'Don Jose Aguirre',
    '10': 'San Antonio',
    '11': 'Lyndieville Subdivision',
    '12': 'Loquilos',
    '13': 'San Vicente',
    '14': 'Market',
  };
  if (!barangay) return 'Not set';
  let key = barangay.toString().padStart(2, '0');
  return map[key] || 'Not set';
}

window.classificationNumberToWord = function(classification) {
  if (classification === null || classification === undefined) return 'Unknown';
  switch (parseInt(classification)) {
    case 1: return 'Residential';
    case 2: return 'Institutional';
    case 3: return 'Commercial';
    case 4: return 'Industrial';
    default: return 'Unknown';
  }
}
