/** Tourism DTOs */

const VALID_CATEGORIES = ['HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN'];
const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING'];

const CreateTourismDto = {
  name: { required: true, type: 'string', minLength: 2 },
  categories: { required: true, type: 'array', isEnumArray: VALID_CATEGORIES },
  description: { required: true, type: 'string' },
  wereda: { required: true, type: 'string' },
  kebele: { required: true, type: 'string' },
  bestTime: { type: 'string' },
  peaceInfo: { type: 'string' },
  visitTime: { type: 'number' },
  languages: { type: 'array' },
  status: { isEnum: VALID_STATUSES },
  imageUrl: { type: 'string' },
  images: { type: 'array' },
};

const UpdateTourismDto = {
  name: { type: 'string', minLength: 2 },
  categories: { type: 'array', isEnumArray: VALID_CATEGORIES },
  description: { type: 'string' },
  wereda: { type: 'string' },
  kebele: { type: 'string' },
  bestTime: { type: 'string' },
  peaceInfo: { type: 'string' },
  visitTime: { type: 'number' },
  languages: { type: 'array' },
  status: { isEnum: VALID_STATUSES },
  imageUrl: { type: 'string' },
  images: { type: 'array' },
};

module.exports = { CreateTourismDto, UpdateTourismDto, VALID_CATEGORIES, VALID_STATUSES };
