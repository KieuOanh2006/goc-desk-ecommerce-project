const pool = require('../../config/database');

const DEFINITIONS = Object.freeze({
  articleCategories: {
    table: 'article_categories',
    select: 'CAST(id AS CHAR) AS id, name, slug, description',
    columns: { name: 'name', slug: 'slug', description: 'description' },
    search: ['name', 'slug'],
    sort: { name: 'name' },
    references: [{ table: 'articles', column: 'article_category_id' }],
  },
  articles: {
    table: 'articles',
    select: 'CAST(id AS CHAR) AS id, CAST(article_category_id AS CHAR) AS categoryId, CAST(author_user_id AS CHAR) AS authorUserId, title, slug, content_type AS contentType, body, media_url AS mediaUrl, status, published_at AS publishedAt, created_at AS createdAt, updated_at AS updatedAt',
    publicSelect: 'CAST(id AS CHAR) AS id, CAST(article_category_id AS CHAR) AS categoryId, title, slug, content_type AS contentType, body, media_url AS mediaUrl, status, published_at AS publishedAt, created_at AS createdAt, updated_at AS updatedAt',
    columns: {
      categoryId: 'article_category_id', authorUserId: 'author_user_id', title: 'title', slug: 'slug',
      contentType: 'content_type', body: 'body', mediaUrl: 'media_url', status: 'status',
    },
    search: ['title', 'slug'],
    sort: { title: 'title', publishedAt: 'published_at' },
    statusColumn: 'status',
    publicWhere: "status = 'published' AND published_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP",
    filters: { categoryId: 'article_category_id', contentType: 'content_type' },
    references: [],
  },
  websiteContents: {
    table: 'website_contents',
    select: 'CAST(id AS CHAR) AS id, content_key AS contentKey, content_type AS contentType, title, body, media_url AS mediaUrl, metadata, status, CAST(updated_by_user_id AS CHAR) AS updatedByUserId, created_at AS createdAt, updated_at AS updatedAt',
    publicSelect: 'CAST(id AS CHAR) AS id, content_key AS contentKey, content_type AS contentType, title, body, media_url AS mediaUrl, metadata, status, created_at AS createdAt, updated_at AS updatedAt',
    columns: {
      contentKey: 'content_key', contentType: 'content_type', title: 'title', body: 'body', mediaUrl: 'media_url',
      metadata: 'metadata', status: 'status', updatedByUserId: 'updated_by_user_id',
    },
    search: ['content_key', 'title'],
    sort: { contentKey: 'content_key', updatedAt: 'updated_at' },
    statusColumn: 'status',
    publicWhere: "status = 'published'",
    filters: { contentKey: 'content_key', contentType: 'content_type' },
    references: [],
  },
});

function createContentModel(database = pool) {
  function getDefinition(resource) {
    const definition = DEFINITIONS[resource];
    if (!definition) throw new TypeError(`Unsupported content resource: ${resource}`);
    return definition;
  }

  function makeWhere(definition, query, { publicOnly = false } = {}) {
    const where = [];
    const params = [];
    if (publicOnly && definition.publicWhere) where.push(definition.publicWhere);
    if (!publicOnly && definition.statusColumn && query.status) {
      where.push(`${definition.statusColumn} = ?`);
      params.push(query.status);
    }
    if (query.q) {
      where.push(`(${definition.search.map((column) => `${column} LIKE ?`).join(' OR ')})`);
      for (let index = 0; index < definition.search.length; index += 1) params.push(`%${query.q}%`);
    }
    for (const [field, column] of Object.entries(definition.filters || {})) {
      if (query[field] !== undefined) {
        where.push(`${column} = ?`);
        params.push(query[field]);
      }
    }
    return { sql: where.length ? ` WHERE ${where.join(' AND ')}` : '', params };
  }

  async function list(resource, query, options = {}) {
    const definition = getDefinition(resource);
    const where = makeWhere(definition, query, options);
    const select = options.publicOnly && definition.publicSelect ? definition.publicSelect : definition.select;
    const [countRows] = await database.execute(
      `SELECT COUNT(*) AS totalItems FROM ${definition.table}${where.sql}`,
      where.params,
    );
    const [sortKey, sortDirection] = query.sort.split(':');
    const sortColumn = definition.sort[sortKey] || definition.sort.name;
    const direction = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const offset = (query.page - 1) * query.limit;
    const [items] = await database.execute(
      `SELECT ${select} FROM ${definition.table}${where.sql} ORDER BY ${sortColumn} ${direction}, id ASC LIMIT ? OFFSET ?`,
      [...where.params, query.limit, offset],
    );
    const totalItems = Number(countRows[0].totalItems);
    return {
      items,
      meta: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) },
    };
  }

  async function find(resource, key, { publicOnly = false, bySlug = false, byKey = false } = {}, connection = database) {
    const definition = getDefinition(resource);
    const select = publicOnly && definition.publicSelect ? definition.publicSelect : definition.select;
    const column = bySlug ? 'slug' : byKey ? 'content_key' : 'id';
    const where = publicOnly && definition.publicWhere ? ` AND ${definition.publicWhere}` : '';
    const [rows] = await connection.execute(
      `SELECT ${select} FROM ${definition.table} WHERE ${column} = ?${where} LIMIT 1`,
      [key],
    );
    return rows[0] || null;
  }

  async function create(resource, input, { publishNow = false } = {}) {
    const definition = getDefinition(resource);
    const entries = Object.entries(input).filter(([field]) => definition.columns[field]);
    const columns = entries.map(([field]) => definition.columns[field]);
    const values = entries.map(([field, value]) => field === 'metadata' && value !== null ? JSON.stringify(value) : value);
    if (publishNow && resource === 'articles') {
      columns.push('published_at');
    }
    const placeholders = values.map(() => '?');
    if (publishNow && resource === 'articles') placeholders.push('CURRENT_TIMESTAMP');
    const [result] = await database.execute(
      `INSERT INTO ${definition.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values,
    );
    return find(resource, String(result.insertId));
  }

  async function update(resource, id, input, { validate: validateUpdate } = {}) {
    const definition = getDefinition(resource);
    const entries = Object.entries(input).filter(([field]) => definition.columns[field]);
    const assignments = entries.map(([field]) => `${definition.columns[field]} = ?`);
    const values = entries.map(([field, value]) => field === 'metadata' && value !== null ? JSON.stringify(value) : value);
    const connection = await database.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [currentRows] = await connection.execute(
        `SELECT ${definition.select} FROM ${definition.table} WHERE id = ? FOR UPDATE`, [id],
      );
      if (!currentRows[0]) {
        await connection.rollback();
        transactionStarted = false;
        return null;
      }
      const current = currentRows[0];
      const effective = { ...current, ...input };
      const updateOptions = await validateUpdate?.({ current, effective }) || {};
      if (updateOptions.publishNow && resource === 'articles') assignments.push('published_at = CURRENT_TIMESTAMP');
      if (updateOptions.clearPublishAt && resource === 'articles') assignments.push('published_at = NULL');
      await connection.execute(
        `UPDATE ${definition.table} SET ${assignments.join(', ')} WHERE id = ?`,
        [...values, id],
      );
      const updated = await find(resource, id, {}, connection);
      await connection.commit();
      transactionStarted = false;
      return updated;
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
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

module.exports = { createContentModel };
