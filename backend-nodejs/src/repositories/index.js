/**
 * Repository Index
 * Central export point for all repositories
 */

const userRepository = require('./user.repository');
const tourismRepository = require('./tourism.repository');
const hotelRepository = require('./hotel.repository');
const bookingRepository = require('./booking.repository');
const ratingRepository = require('./rating.repository');
const roadRepository = require('./road.repository');
const horseServiceRepository = require('./horse-service.repository');
const languageGuiderRepository = require('./language-guider.repository');
const mapPointRepository = require('./map-point.repository');
const auditRepository = require('./audit.repository');
const authRepository = require('./auth.repository');
const imageRepository = require('./image.repository');
const bookingMessageRepository = require('./booking-message.repository');
const roleRepository = require('./role.repository');
const tourismViewRepository = require('./tourism-view.repository');

module.exports = {
  userRepository,
  tourismRepository,
  hotelRepository,
  bookingRepository,
  ratingRepository,
  roadRepository,
  horseServiceRepository,
  languageGuiderRepository,
  mapPointRepository,
  auditRepository,
  authRepository,
  imageRepository,
  bookingMessageRepository,
  roleRepository,
  tourismViewRepository,
};
