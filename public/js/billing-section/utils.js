// public/js/utils.js

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

window.toLongDate = function(dateStr) {
  console.log('toLongDate called with:', dateStr);
    if (!dateStr) return "";

    // Split YYYY/MM/DD
    const [year, month, day] = dateStr.split('/').map(Number);

    // Create Date object (month index starts at 0 in JS)
    const dateObj = new Date(year, month - 1, day);

    // Format
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

window.monthYear = function(dateStr) {
    if (!dateStr) return "";

    // Split YYYY/MM/DD
    const [year, month] = dateStr.split('-').map(Number);

    // Create Date object (month index starts at 0 in JS)
    const dateObj = new Date(year, month - 1);

    // Format
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
}
