const pool = require('../../config/database');

const DEFINITIONS = Object.freeze({
  categories: {
    table: 'categories',
    select: 'CAST(id AS CHAR) AS id, name, slug, description, image_url AS imageUrl, sort_order AS sortOrder, status, created_at AS createdAt, updated_at AS updatedAt',
    columns: { name: 'name', slug: 'slug', description: 'description', imageUrl: 'image_url', sortOrder: 'sort_order', status: 'status' },
    search: ['name', 'slug'],
    sort: { name: 'name', createdAt: 'created_at' },
    hasStatus: true,
    references: [
      { table: 'products', column: 'category_id' },
      { table: 'categories', column: 'parent_category_id' },
    ],
  },
  brands: {
    table: 'brands',
    select: 'CAST(id AS CHAR) AS id, name, slug, status, created_at AS createdAt, updated_at AS updatedAt',
    columns: { name: 'name', slug: 'slug', status: 'status' },
    search: ['name', 'slug'],
    sort: { name: 'name', createdAt: 'created_at' },
    hasStatus: true,
    references: [{ table: 'products', column: 'brand_id' }],
  },
  useCases: {
    table: 'use_cases',
    select: 'CAST(id AS CHAR) AS id, name, slug, description',
    columns: { name: 'name', slug: 'slug', description: 'description' },
    search: ['name', 'slug'],
    sort: { name: 'name' },
    hasStatus: false,
    references: [{ table: 'product_use_cases', column: 'use_case_id' }],
  },
});

function createCatalogModel(database = pool) {
  function getDefinition(resource) {
    const definition = DEFINITIONS[resource];
    if (!definition) throw new TypeError(`Unsupported catalog resource: ${resource}`);
    return definition;
  }

  async function list(resource, query, { publicOnly = false } = {}) {
    const definition = getDefinition(resource);
    const where = [];
    const params = [];

    if (query.q) {
      where.push(`(${definition.search.map((column) => `${column} LIKE ?`).join(' OR ')})`);
      for (let index = 0; index < definition.search.length; index += 1) params.push(`%${query.q}%`);
    }
    if (publicOnly && definition.hasStatus) where.push("status = 'active'");
    if (!publicOnly && definition.hasStatus && query.status) {
      where.push('status = ?');
      params.push(query.status);
    }

    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await database.execute(
      `SELECT COUNT(*) AS totalItems FROM ${definition.table}${whereSql}`,
      params,
    );
    const sortParts = query.sort.split(':');
    const sortColumn = definition.sort[sortParts[0]] || definition.sort.name;
    const direction = sortParts[1] === 'desc' ? 'DESC' : 'ASC';
    const offset = (query.page - 1) * query.limit;
    const [items] = await database.execute(
      `SELECT ${definition.select} FROM ${definition.table}${whereSql} ORDER BY ${sortColumn} ${direction}, id ASC LIMIT ? OFFSET ?`,
      [...params, query.limit, offset],
    );
    const totalItems = Number(countRows[0].totalItems);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  async function find(resource, id, { publicOnly = false } = {}) {
    const definition = getDefinition(resource);
    const params = [id];
    const statusFilter = publicOnly && definition.hasStatus ? " AND status = 'active'" : '';
    const [rows] = await database.execute(
      `SELECT ${definition.select} FROM ${definition.table} WHERE id = ?${statusFilter} LIMIT 1`,
      params,
    );
    return rows[0] || null;
  }

  async function create(resource, input) {
    const definition = getDefinition(resource);
    const entries = Object.entries(input).filter(([field]) => definition.columns[field]);
    if (entries.length === 0) throw new TypeError('Catalog create requires at least one supported field.');
    const columns = entries.map(([field]) => definition.columns[field]);
    const values = entries.map(([, value]) => value);
    const [result] = await database.execute(
      `INSERT INTO ${definition.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values,
    );
    return find(resource, String(result.insertId));
  }

  async function update(resource, id, input) {
    const definition = getDefinition(resource);
    const entries = Object.entries(input).filter(([field]) => definition.columns[field]);
    if (entries.length === 0) throw new TypeError('Catalog update requires at least one supported field.');
    const assignments = entries.map(([field]) => `${definition.columns[field]} = ?`);
    const values = entries.map(([, value]) => value);
    await database.execute(
      `UPDATE ${definition.table} SET ${assignments.join(', ')} WHERE id = ?`,
      [...values, id],
    );
    return find(resource, id);
  }

  async function remove(resource, id) {
    const definition = getDefinition(resource);
    const connection = await database.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [rows] = await connection.execute(
        `SELECT id FROM ${definition.table} WHERE id = ? FOR UPDATE`,
        [id],
      );
      if (rows.length === 0) {
        await connection.rollback();
        return { found: false, deleted: false };
      }

      for (const reference of definition.references) {
        const [references] = await connection.execute(
          `SELECT 1 AS found FROM ${reference.table} WHERE ${reference.column} = ? LIMIT 1`,
          [id],
        );
        if (references.length > 0) {
          await connection.rollback();
          return { found: true, deleted: false, referenced: true };
        }
      }

      await connection.execute(`DELETE FROM ${definition.table} WHERE id = ?`, [id]);
      await connection.commit();
      return { found: true, deleted: true };
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  return { create, find, list, remove, update };
}

module.exports = { createCatalogModel };
