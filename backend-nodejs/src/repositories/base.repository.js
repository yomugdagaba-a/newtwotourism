/**
 * Base Repository
 * Provides common CRUD operations for all repositories
 * Abstracts Prisma operations for better maintainability and testability
 */

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Create a new record
   */
  async create(data) {
    return await this.model.create({ data });
  }

  /**
   * Find record by ID
   */
  async findById(id, include = {}) {
    return await this.model.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find all records with pagination
   */
  async findAll(skip = 0, take = 10, where = {}, include = {}, orderBy = {}) {
    const [data, total] = await Promise.all([
      this.model.findMany({
        skip,
        take,
        where,
        include,
        orderBy,
      }),
      this.model.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find one record by criteria
   */
  async findOne(where, include = {}) {
    return await this.model.findFirst({
      where,
      include,
    });
  }

  /**
   * Find many records by criteria
   */
  async findMany(where = {}, include = {}, orderBy = {}) {
    return await this.model.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Update many records
   */
  async updateMany(where, data) {
    return await this.model.updateMany({
      where,
      data,
    });
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    return await this.model.delete({
      where: { id },
    });
  }

  /**
   * Delete many records
   */
  async deleteMany(where) {
    return await this.model.deleteMany({
      where,
    });
  }

  /**
   * Count records
   */
  async count(where = {}) {
    return await this.model.count({ where });
  }

  /**
   * Check if record exists
   */
  async exists(where) {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Upsert (create or update)
   */
  async upsert(where, create, update) {
    return await this.model.upsert({
      where,
      create,
      update,
    });
  }
}

module.exports = BaseRepository;
