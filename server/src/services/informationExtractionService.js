const firstMatch = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
};

const knownMakes = [
  'maruti suzuki',
  'land rover',
  'mercedes benz',
  'toyota',
  'honda',
  'hyundai',
  'tata',
  'ford',
  'volkswagen',
  'kia',
  'bmw',
  'audi',
  'nissan',
  'renault',
  'mahindra',
  'skoda',
  'chevrolet',
  'jeep',
  'mg',
];

export const extractInformationFromMessage = (message = '') => {
  const text = String(message).trim();
  const lowerText = text.toLowerCase();
  const customer = {};
  const vehicle = {};

  const fullName = firstMatch(text, [
    /(?:my name is|name is|i am)\s+([a-z][a-z' -]{1,80}?)(?=,|\.|\s+and\b|\s+(?:my\s+)?(?:phone|email)\b|$)/i,
  ]);
  const phoneNumber = firstMatch(text, [
    /(?:phone(?: number)?|mobile(?: number)?|contact number)\s*(?:is|:)?\s*([+\d][\d\s().-]{6,24}\d)/i,
  ]);
  const email = firstMatch(text, [
    /(?:email(?: address)?|e-mail)\s*(?:is|:)?\s*([\w.+-]+@[\w.-]+\.[a-z]{2,})/i,
  ]);
  const preferredServiceLocation = firstMatch(text, [
    /\b(?:preferred\s+)?(?:service\s+)?(?:location|branch|workshop)\b\s*(?:is|:)?\s*([^.;]+)/i,
  ]);
  const preferredServiceDate = firstMatch(text, [
    /\b(?:preferred\s+)?(?:service\s+)?(?:date|day|appointment)\b\s*(?:is|:)?\s*([^.;]+)/i,
  ]);
  const mileageValue = firstMatch(text, [
    /(?:mileage|miles|odometer)\s*(?:is|at|:)?\s*([\d,]+)/i,
  ]);
  const registrationNumber = firstMatch(text, [
    /\b(?:registration|reg|number plate|plate)\s*(?:number|no\.?|is|:)?\s*([a-z0-9 -]{4,20})(?=,|\.|\s+and\s+|$)/i,
  ]);
  const vin = firstMatch(text, [
    /\bvin\s*(?:number|is|:)?\s*([a-z0-9 -]{8,30})(?=,|\.|\s+and\s+|$)/i,
  ]);

  if (fullName) customer.fullName = fullName;
  if (phoneNumber) customer.phoneNumber = phoneNumber.replace(/\s+/g, ' ').trim();
  if (email) customer.email = email;
  if (preferredServiceLocation) customer.preferredServiceLocation = preferredServiceLocation;
  if (preferredServiceDate) customer.preferredServiceDate = preferredServiceDate;
  if (mileageValue) vehicle.mileage = Number(mileageValue.replace(/,/g, ''));
  if (registrationNumber) vehicle.registrationNumber = registrationNumber.replace(/\s+/g, ' ').trim();
  if (vin) vehicle.vin = vin.replace(/\s+/g, '').toUpperCase();

  const vehicleMatch = text.match(
    /(?:drive|driving|vehicle is|have a|own a|it's a)\s+(?:(\d{4})\s+)?([a-z][a-z0-9-]{1,30})\s+([a-z0-9][a-z0-9 -]{1,40})(?=,|\.|\s+with\s+|\s+and\s+|$)/i
  );

  if (vehicleMatch) {
    const [, year, make, model] = vehicleMatch;
    vehicle.make = make.trim();
    vehicle.model = model.trim();
    if (year) vehicle.year = Number(year);
  }

  const yearMakeModelMatch = text.match(
    /(?:my|a)\s+(\d{4})\s+([a-z][a-z0-9-]{1,30})\s+([a-z0-9][a-z0-9 -]{1,40})(?=,|\.|\s+with\s+|\s+and\s+|$)/i
  );

  if (yearMakeModelMatch) {
    const [, year, make, model] = yearMakeModelMatch;
    vehicle.year = Number(year);
    vehicle.make = make.trim();
    vehicle.model = model.trim();
  }

  const labeledVehicleMatch = text.match(
    /\b((?:[a-z][a-z-]*\s+){1,2})([a-z0-9-]+)\s+model\s+([a-z0-9-]+)\s+year\s*(?:is\s*)?(\d{4})\b/i
  );

  if (labeledVehicleMatch) {
    const [, make, baseModel, variant, year] = labeledVehicleMatch;
    vehicle.year = Number(year);
    vehicle.make = make.trim();
    vehicle.model = `${baseModel} ${variant}`.trim();
  }

  const separatedVehicleFields = {
    make: firstMatch(text, [
      /(?:vehicle|car)?\s*make\s*(?:is|:)?\s*([a-z][a-z -]{1,40}?)(?=,|\s+(?:and\s+)?(?:the\s+)?model|\s+year|$)/i,
    ]),
    model: firstMatch(text, [
      /model\s*(?:is|:)?\s*([a-z0-9][a-z0-9 -]{1,40})(?=,|\s+year|$)/i,
    ]),
    year: firstMatch(text, [
      /(?:model\s+)?year\s*(?:is|:)?\s*(\d{4})\b/i,
    ]),
  };

  if (separatedVehicleFields.make && !vehicle.make) {
    vehicle.make = separatedVehicleFields.make.trim();
  }
  if (separatedVehicleFields.model && !vehicle.model) {
    vehicle.model = separatedVehicleFields.model.trim();
  }
  if (separatedVehicleFields.year && !vehicle.year) {
    vehicle.year = Number(separatedVehicleFields.year);
  }

  const spokenYear = text.match(/\b((?:19|20)\d{2})\b/);
  const matchedMake = knownMakes.find((make) => lowerText.includes(make));
  if (spokenYear && !vehicle.year) {
    vehicle.year = Number(spokenYear[1]);
  }
  if (matchedMake) {
    const makeStart = lowerText.indexOf(matchedMake);
    let modelText = text.slice(makeStart + matchedMake.length);
    modelText = modelText
      .replace(/^\s*(?:and\s+the\s+)?model\s*(?:is|:)?\s*/i, '')
      .replace(/\s+model\s+.*$/i, '')
      .replace(/[,;.]?\s*(?:year\s*(?:is|:)?\s*)?(?:19|20)\d{2}.*$/i, '')
      .split(/[,;.]/)[0]
      .trim();

    vehicle.make = text.slice(makeStart, makeStart + matchedMake.length).trim();
    if (
      modelText &&
      !labeledVehicleMatch &&
      !/^(?:is|and|the)$/i.test(modelText)
    ) {
      vehicle.model = modelText.trim();
    }
  }

  const issueStarted = firstMatch(text, [
    /(?:issue|problem|trouble)\s+(?:started|began)\s+([^,.;]+)/i,
    /(?:started|began)\s+([^,.;]+)/i,
  ]);
  if (issueStarted) vehicle.issueStarted = issueStarted;

  if (/(?:it is|it's|it’s)\s+not\s+drivable|cannot drive|can't drive|not safe to drive/i.test(text)) {
    vehicle.isDrivable = false;
  } else if (/(?:it|the car|the vehicle)\s+is\s+(?:still\s+)?drivable|(?:it's|it’s)\s+(?:still\s+)?drivable|can still drive|safe to drive/i.test(text)) {
    vehicle.isDrivable = true;
  }

  const issuePatternMatch = text.match(/\b(intermittent|constant|continuous|all the time|comes and goes)\b/i);
  if (issuePatternMatch) {
    vehicle.issuePattern = /intermittent|comes and goes/i.test(issuePatternMatch[1])
      ? 'intermittent'
      : 'constant';
  }

  const recentRepairMatch = text.match(
    /(?:recent|last)\s+(?:repair|service|maintenance|accident)\s*(?:was|is|:)?\s*([^.;]+?)(?=,?\s+and\b|[.;]|$)/i
  );
  if (recentRepairMatch?.[1]) {
    vehicle.recentRepairs = recentRepairMatch[1].trim();
  }

  const warningLightMatch = text.match(
    /(?:warning light|dashboard light|check engine light)\s*(?:is|:)?\s*([^.;]+?)(?=,?\s+and\s+|[.;]|$)/i
  );
  if (warningLightMatch?.[1]) {
    vehicle.warningLights = [warningLightMatch[1].trim()];
  } else if (lowerText.includes('check engine light')) {
    vehicle.warningLights = ['check engine light'];
  }

  return { customer, vehicle };
};
