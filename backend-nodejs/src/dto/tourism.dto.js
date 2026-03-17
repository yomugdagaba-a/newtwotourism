/** Tourism DTOs */

const VALID_CATEGORIES = ['HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN'];

const CreateTourismDto = {
  name: { required: true, type: 'string', minLength: 2 },
  description: { required: true, type: 'string' },
  wereda: { required: true, type: 'string' },
  kebele: { required: true, type: 'string' },
};

const UpdateTourismDto = {
  name: { type: 'string', minLength: 2 },
  description: { type: 'string' },
  wereda: { type: 'string' },
  kebele: { type: 'string' },
};

module.exports = { CreateTourismDto, UpdateTourismDto, VALID_CATEGORIES };
