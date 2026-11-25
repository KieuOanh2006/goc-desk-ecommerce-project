const pool = require('../../config/database');

function jsonValue(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
}

function mapRoom(row) {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    roomConfig: jsonValue(row.roomConfig),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapFurnitureAsset(row) {
  return {
    id: String(row.id),
    assetCode: row.assetCode,
    name: row.name,
    furnitureType: row.furnitureType,
    rendererType: row.rendererType,
    rendererKey: row.rendererKey,
    modelUrl: row.modelUrl,
    dimensions: jsonValue(row.dimensions),
    defaultColor: row.defaultColor,
    isActive: Boolean(row.isActive),
  };
}

function mapProductModel(row) {
  return {
    id: String(row.id),
    productId: String(row.productId),
    productName: row.productName,
    productSlug: row.productSlug,
    categoryKey: row.categoryKey,
    imageUrl: row.imageUrl,
    rendererType: row.rendererType,
    rendererKey: row.rendererKey,
    modelUrl: row.modelUrl,
    width: Number(row.width),
    depth: Number(row.depth),
    height: Number(row.height),
    surfaceType: row.surfaceType,
    isActive: Boolean(row.isActive),
    variants: row.variants || [],
  };
}

function createStudioAssetsModel(database = pool) {
  const roomFields = {
    name: 'name', slug: 'slug', description: 'description', roomConfig: 'room_config', isActive: 'is_active',
  };
  const assetFields = {
    assetCode: 'asset_code', name: 'name', furnitureType: 'furniture_type', rendererType: 'renderer_type',
    rendererKey: 'renderer_key', modelUrl: 'model_url', dimensions: 'dimensions',
    defaultColor: 'default_color', isActive: 'is_active',
  };
  const productModelFields = {
    productId: 'product_id', rendererType: 'renderer_type', rendererKey: 'renderer_key', modelUrl: 'model_url',
    width: 'width', depth: 'depth', height: 'height', surfaceType: 'surface_type', isActive: 'is_active',
  };

  function buildAssignments(input, fields) {
    const entries = Object.entries(input).filter(([key]) => fields[key]);
    return {
      assignments: entries.map(([key]) => `${fields[key]} = ?`),
      values: entries.map(([key, value]) => ['roomConfig', 'dimensions'].includes(key) && value !== null ? JSON.stringify(value) : value),
    };
  }

  function addStatusFilter(where, params, alias, publicOnly, status) {
    if (publicOnly) where.push(`${alias}.is_active = TRUE`);
    else if (status) {
      where.push(`${alias}.is_active = ?`);
      params.push(status === 'active' ? 1 : 0);
    }
  }

  async function listRooms(query, { publicOnly = false, status } = {}) {
    const where = [];
    const params = [];
    if (query.q) {
      where.push('(r.name LIKE ? OR r.slug LIKE ?)');
      params.push(`%${query.q}%`, `%${query.q}%`);
    }
    addStatusFilter(where, params, 'r', publicOnly, status);
    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const [[countRows], [rows]] = await Promise.all([
      database.execute(`SELECT COUNT(*) AS totalItems FROM room_templates r${whereSql}`, params),
      database.execute(
        `SELECT CAST(r.id AS CHAR) AS id, r.name, r.slug, r.description, r.room_config AS roomConfig,
                r.is_active AS isActive, r.created_at AS createdAt, r.updated_at AS updatedAt
         FROM room_templates r${whereSql}
         ORDER BY ${query.sort.startsWith('createdAt') ? 'r.created_at' : 'r.name'} ${query.sort.endsWith(':desc') ? 'DESC' : 'ASC'}, r.id ASC
         LIMIT ? OFFSET ?`,
        [...params, query.limit, (query.page - 1) * query.limit],
      ),
    ]);
    const rooms = await attachRoomFurniture(rows.map(mapRoom), database, publicOnly);
    const totalItems = Number(countRows[0].totalItems);
    return { items: rooms, meta: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) } };
  }

  async function findRoom(id, { publicOnly = false } = {}, connection = database) {
    const [rows] = await connection.execute(
      `SELECT CAST(r.id AS CHAR) AS id, r.name, r.slug, r.description, r.room_config AS roomConfig,
              r.is_active AS isActive, r.created_at AS createdAt, r.updated_at AS updatedAt
       FROM room_templates r WHERE r.id = ?${publicOnly ? ' AND r.is_active = TRUE' : ''} LIMIT 1`,
      [id],
    );
    if (!rows[0]) return null;
    const [room] = await attachRoomFurniture([mapRoom(rows[0])], connection, publicOnly);
    return room;
  }

  async function attachRoomFurniture(rooms, connection, publicOnly = false) {
    if (rooms.length === 0) return rooms;
    const placeholders = rooms.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT CAST(rtf.room_template_id AS CHAR) AS roomTemplateId,
              CAST(fa.id AS CHAR) AS furnitureAssetId, fa.asset_code AS assetCode, fa.name,
              fa.furniture_type AS furnitureType, fa.renderer_type AS rendererType,
              fa.renderer_key AS rendererKey, fa.model_url AS modelUrl, fa.dimensions,
              fa.default_color AS defaultColor, rtf.position_x AS positionX,
              rtf.position_z AS positionZ, rtf.rotation, rtf.is_present AS isPresent,
              rtf.color_hex AS colorHex
       FROM room_template_furniture rtf
       JOIN furniture_assets fa ON fa.id = rtf.furniture_asset_id
       WHERE rtf.room_template_id IN (${placeholders})${publicOnly
    ? " AND fa.is_active = TRUE AND (fa.renderer_type = 'glb' OR (fa.renderer_type = 'procedural' AND fa.renderer_key IN ('desk', 'cabinet', 'bed', 'chair', 'rug', 'plant')))"
    : ''}
       ORDER BY rtf.room_template_id, fa.id`,
      rooms.map((room) => room.id),
    );
    const byRoom = new Map(rooms.map((room) => [room.id, []]));
    for (const row of rows) {
      byRoom.get(String(row.roomTemplateId))?.push({
        furnitureAssetId: String(row.furnitureAssetId),
        assetCode: row.assetCode,
        name: row.name,
        furnitureType: row.furnitureType,
        rendererType: row.rendererType,
        rendererKey: row.rendererKey,
        modelUrl: row.modelUrl,
        dimensions: jsonValue(row.dimensions),
        positionX: Number(row.positionX),
        positionZ: Number(row.positionZ),
        rotation: Number(row.rotation),
        isPresent: Boolean(row.isPresent),
        colorHex: row.colorHex,
      });
    }
    return rooms.map((room) => ({ ...room, furniture: byRoom.get(room.id) || [] }));
  }

  async function createRoom(input) {
    const { values } = buildAssignments(input, roomFields);
    const columns = Object.keys(input).filter((field) => roomFields[field]).map((field) => roomFields[field]);
    const [result] = await database.execute(
      `INSERT INTO room_templates (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values,
    );
    return findRoom(String(result.insertId));
  }

  async function updateRoom(id, input, validateRoom) {
    const connection = await database.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [roomRows] = await connection.execute(
        `SELECT CAST(id AS CHAR) AS id, name, slug, description, room_config AS roomConfig,
                is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
         FROM room_templates WHERE id = ? FOR UPDATE`, [id],
      );
      if (!roomRows[0]) {
        await connection.rollback();
        transactionStarted = false;
        return null;
      }
      const room = mapRoom(roomRows[0]);
      let placements = [];
      if (input.roomConfig !== undefined) {
        const [placementRows] = await connection.execute(
          `SELECT fa.name, fa.dimensions, rtf.position_x AS positionX, rtf.position_z AS positionZ, rtf.rotation
           FROM room_template_furniture rtf
           JOIN furniture_assets fa ON fa.id = rtf.furniture_asset_id
           WHERE rtf.room_template_id = ? FOR UPDATE`, [id],
        );
        placements = placementRows.map((row) => ({
          name: row.name, dimensions: jsonValue(row.dimensions),
          positionX: Number(row.positionX), positionZ: Number(row.positionZ), rotation: Number(row.rotation),
        }));
        validateRoom?.({ room, placements });
      }
      const { assignments, values } = buildAssignments(input, roomFields);
      await connection.execute(`UPDATE room_templates SET ${assignments.join(', ')} WHERE id = ?`, [...values, id]);
      const updatedRoom = await findRoom(id, {}, connection);
      await connection.commit();
      transactionStarted = false;
      return updatedRoom;
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  async function removeRoom(id) {
    return deleteWithReferenceCheck({
      id, table: 'room_templates', referenceTable: 'saved_setups', referenceColumn: 'room_template_id', database,
    });
  }

  async function listFurnitureAssets(query, { publicOnly = false, status } = {}) {
    const where = [];
    const params = [];
    if (query.q) {
      where.push('(a.asset_code LIKE ? OR a.name LIKE ? OR a.renderer_key LIKE ?)');
      params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
    }
    addStatusFilter(where, params, 'a', publicOnly, status);
    if (publicOnly) where.push("(a.renderer_type = 'glb' OR (a.renderer_type = 'procedural' AND a.renderer_key IN ('desk', 'cabinet', 'bed', 'chair', 'rug', 'plant')))");
    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const [[countRows], [rows]] = await Promise.all([
      database.execute(`SELECT COUNT(*) AS totalItems FROM furniture_assets a${whereSql}`, params),
      database.execute(
        `SELECT CAST(a.id AS CHAR) AS id, a.asset_code AS assetCode, a.name,
                a.furniture_type AS furnitureType, a.renderer_type AS rendererType,
                a.renderer_key AS rendererKey, a.model_url AS modelUrl, a.dimensions,
                a.default_color AS defaultColor, a.is_active AS isActive
         FROM furniture_assets a${whereSql}
         ORDER BY ${query.sort.startsWith('id:') ? 'a.id' : 'a.name'} ${query.sort.endsWith(':desc') ? 'DESC' : 'ASC'}, a.id ASC
         LIMIT ? OFFSET ?`,
        [...params, query.limit, (query.page - 1) * query.limit],
      ),
    ]);
    const totalItems = Number(countRows[0].totalItems);
    return { items: rows.map(mapFurnitureAsset), meta: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) } };
  }

  async function findFurnitureAsset(id, { publicOnly = false } = {}, connection = database) {
    const [rows] = await connection.execute(
      `SELECT CAST(a.id AS CHAR) AS id, a.asset_code AS assetCode, a.name,
              a.furniture_type AS furnitureType, a.renderer_type AS rendererType,
              a.renderer_key AS rendererKey, a.model_url AS modelUrl, a.dimensions,
              a.default_color AS defaultColor, a.is_active AS isActive
       FROM furniture_assets a WHERE a.id = ?${publicOnly ? ' AND a.is_active = TRUE' : ''} LIMIT 1`,
      [id],
    );
    return rows[0] ? mapFurnitureAsset(rows[0]) : null;
  }

  async function findFurnitureAssetsByIds(ids, connection = database) {
    if (ids.length === 0) return [];
    const [rows] = await connection.execute(
      `SELECT CAST(id AS CHAR) AS id, asset_code AS assetCode, name, furniture_type AS furnitureType,
              renderer_type AS rendererType, renderer_key AS rendererKey, model_url AS modelUrl,
              dimensions, default_color AS defaultColor, is_active AS isActive
       FROM furniture_assets WHERE id IN (${ids.map(() => '?').join(', ')}) FOR UPDATE`,
      ids,
    );
    return rows.map(mapFurnitureAsset);
  }

  async function createFurnitureAsset(input) {
    const { values } = buildAssignments(input, assetFields);
    const columns = Object.keys(input).filter((field) => assetFields[field]).map((field) => assetFields[field]);
    const [result] = await database.execute(
      `INSERT INTO furniture_assets (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values,
    );
    return findFurnitureAsset(String(result.insertId));
  }

  async function updateFurnitureAsset(id, input, validateAsset) {
    const connection = await database.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [assetRows] = await connection.execute(
        `SELECT CAST(id AS CHAR) AS id, asset_code AS assetCode, name, furniture_type AS furnitureType,
                renderer_type AS rendererType, renderer_key AS rendererKey, model_url AS modelUrl,
                dimensions, default_color AS defaultColor, is_active AS isActive
         FROM furniture_assets WHERE id = ? FOR UPDATE`, [id],
      );
      if (!assetRows[0]) {
        await connection.rollback();
        transactionStarted = false;
        return null;
      }
      const current = mapFurnitureAsset(assetRows[0]);
      const protectedFields = new Set(['furnitureType', 'rendererType', 'rendererKey', 'modelUrl', 'dimensions', 'isActive']);
      const changesRendering = Object.keys(input).some((field) => protectedFields.has(field));
      if (changesRendering) {
        const [roomReferences] = await connection.execute(
          'SELECT 1 AS found FROM room_template_furniture WHERE furniture_asset_id = ? LIMIT 1 FOR UPDATE', [id],
        );
        const [setupReferences] = await connection.execute(
          'SELECT 1 AS found FROM setup_furniture WHERE furniture_asset_id = ? LIMIT 1 FOR UPDATE', [id],
        );
        if (roomReferences.length || setupReferences.length) {
          await connection.rollback();
          transactionStarted = false;
          return { found: true, inUse: true };
        }
      }
      validateAsset?.({ ...current, ...input });
      const { assignments, values } = buildAssignments(input, assetFields);
      await connection.execute(`UPDATE furniture_assets SET ${assignments.join(', ')} WHERE id = ?`, [...values, id]);
      const updatedAsset = await findFurnitureAsset(id, {}, connection);
      await connection.commit();
      transactionStarted = false;
      return updatedAsset;
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  async function removeFurnitureAsset(id) {
    return deleteWithReferenceCheck({
      id, table: 'furniture_assets', referenceTable: 'room_template_furniture', referenceColumn: 'furniture_asset_id',
      extraReferences: [{ table: 'setup_furniture', column: 'furniture_asset_id' }], database,
    });
  }

  async function listProductModels(query, { publicOnly = false, status } = {}) {
    const where = [];
    const params = [];
    if (query.q) {
      where.push('(p.name LIKE ? OR p.slug LIKE ? OR m.renderer_key LIKE ?)');
      params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
    }
    if (publicOnly) {
      where.push('m.is_active = TRUE', "p.status = 'active'", "c.status = 'active'", "(m.renderer_type = 'glb' OR (m.renderer_type = 'procedural' AND m.renderer_key = c.slug))", `EXISTS (
        SELECT 1 FROM product_variants active_variant
        WHERE active_variant.product_id = p.id AND active_variant.status = 'active'
      )`);
    } else {
      if (status) {
        where.push('m.is_active = ?');
        params.push(status === 'active' ? 1 : 0);
      }
    }
    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const [[countRows], [rows]] = await Promise.all([
      database.execute(
        `SELECT COUNT(*) AS totalItems FROM product_3d_models m
         JOIN products p ON p.id = m.product_id JOIN categories c ON c.id = p.category_id${whereSql}`,
        params,
      ),
      database.execute(
        `${productModelSelectSql()}${whereSql}
         ORDER BY ${query.sort.startsWith('id:') ? 'm.id' : 'p.name'} ${query.sort.endsWith(':desc') ? 'DESC' : 'ASC'}, m.id ASC
         LIMIT ? OFFSET ?`,
        [...params, query.limit, (query.page - 1) * query.limit],
      ),
    ]);
    const items = rows.map(mapProductModel);
    if (publicOnly && items.length > 0) await attachProductVariants(items, database);
    const totalItems = Number(countRows[0].totalItems);
    return { items, meta: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) } };
  }

  async function findProductModel(id, { publicOnly = false } = {}, connection = database) {
    const where = ['m.id = ?'];
    if (publicOnly) where.push('m.is_active = TRUE', "p.status = 'active'", "c.status = 'active'", "(m.renderer_type = 'glb' OR (m.renderer_type = 'procedural' AND m.renderer_key = c.slug))", `EXISTS (
      SELECT 1 FROM product_variants active_variant
      WHERE active_variant.product_id = p.id AND active_variant.status = 'active'
    )`);
    const [rows] = await connection.execute(`${productModelSelectSql()} WHERE ${where.join(' AND ')} LIMIT 1`, [id]);
    if (!rows[0]) return null;
    const [item] = rows.map(mapProductModel);
    if (publicOnly) await attachProductVariants([item], connection);
    return item;
  }

  function productModelSelectSql() {
    return `SELECT CAST(m.id AS CHAR) AS id, CAST(m.product_id AS CHAR) AS productId,
            p.name AS productName, p.slug AS productSlug, c.slug AS categoryKey,
            (SELECT image.image_url FROM product_images image
             WHERE image.product_id = p.id AND image.variant_id IS NULL
             ORDER BY image.is_primary DESC, image.sort_order, image.id LIMIT 1) AS imageUrl,
            m.renderer_type AS rendererType, m.renderer_key AS rendererKey, m.model_url AS modelUrl,
            m.width, m.depth, m.height, m.surface_type AS surfaceType, m.is_active AS isActive
     FROM product_3d_models m JOIN products p ON p.id = m.product_id
     JOIN categories c ON c.id = p.category_id`;
  }

  async function attachProductVariants(items, connection) {
    if (items.length === 0) return;
    const productIds = items.map((item) => item.productId);
    const [rows] = await connection.execute(
      `SELECT CAST(v.product_id AS CHAR) AS productId, CAST(v.id AS CHAR) AS id,
              v.sku, v.color_name AS colorName, v.color_hex AS colorHex,
              v.price, v.sale_price AS salePrice, v.sale_starts_at AS saleStartsAt,
              v.sale_ends_at AS saleEndsAt, v.stock_quantity AS stockQuantity,
              CASE WHEN v.sale_price IS NOT NULL
                     AND (v.sale_starts_at IS NULL OR v.sale_starts_at <= CURRENT_TIMESTAMP)
                     AND (v.sale_ends_at IS NULL OR v.sale_ends_at >= CURRENT_TIMESTAMP)
                   THEN v.sale_price ELSE v.price END AS effectivePrice,
              COALESCE(
                (SELECT image.image_url FROM product_images image
                 WHERE image.product_id = v.product_id AND image.variant_id = v.id
                 ORDER BY image.is_primary DESC, image.sort_order, image.id LIMIT 1),
                (SELECT image.image_url FROM product_images image
                 WHERE image.product_id = v.product_id AND image.variant_id IS NULL
                 ORDER BY image.is_primary DESC, image.sort_order, image.id LIMIT 1)
              ) AS imageUrl
       FROM product_variants v
       WHERE v.product_id IN (${productIds.map(() => '?').join(', ')}) AND v.status = 'active'
       ORDER BY v.product_id, v.id`,
      productIds,
    );
    const byProduct = new Map(items.map((item) => [item.productId, []]));
    for (const row of rows) {
      byProduct.get(String(row.productId))?.push({
        id: String(row.id), sku: row.sku, colorName: row.colorName, colorHex: row.colorHex,
        price: String(row.price), salePrice: row.salePrice == null ? null : String(row.salePrice),
        effectivePrice: String(row.effectivePrice), saleStartsAt: row.saleStartsAt, saleEndsAt: row.saleEndsAt,
        stockQuantity: String(row.stockQuantity), available: Number(row.stockQuantity) > 0, imageUrl: row.imageUrl,
      });
    }
    for (const item of items) item.variants = byProduct.get(item.productId) || [];
  }

  async function findProductForModel(productId, connection = database, lock = false) {
    const [rows] = await connection.execute(
      `SELECT CAST(p.id AS CHAR) AS id, p.status, c.slug AS categoryKey, c.status AS categoryStatus
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
      [productId],
    );
    return rows[0] || null;
  }

  async function createProductModel(input, validateProduct) {
    const connection = await database.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const product = await findProductForModel(input.productId, connection, true);
      if (!product) {
        await connection.rollback();
        return { productFound: false };
      }
      if (product.status !== 'active' || product.categoryStatus !== 'active') {
        await connection.rollback();
        return { productFound: true, productActive: false };
      }
      validateProduct?.(product);
      const inputWithProduct = { ...input };
      const { values } = buildAssignments(inputWithProduct, productModelFields);
      const columns = Object.keys(inputWithProduct).filter((field) => productModelFields[field]).map((field) => productModelFields[field]);
      const [result] = await connection.execute(
        `INSERT INTO product_3d_models (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values,
      );
      const model = await findProductModel(String(result.insertId), {}, connection);
      await connection.commit();
      transactionStarted = false;
      return { model };
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  async function updateProductModel(id, input, validateProduct) {
    const connection = await database.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [modelRows] = await connection.execute(
        `SELECT CAST(product_id AS CHAR) AS productId, renderer_type AS rendererType,
                renderer_key AS rendererKey, model_url AS modelUrl, width, depth, height,
                surface_type AS surfaceType, is_active AS isActive
         FROM product_3d_models WHERE id = ? FOR UPDATE`, [id],
      );
      if (!modelRows[0]) {
        await connection.rollback();
        transactionStarted = false;
        return null;
      }
      const effectiveProductId = input.productId || String(modelRows[0].productId);
      const product = await findProductForModel(effectiveProductId, connection, true);
      if (!product) {
        await connection.rollback();
        transactionStarted = false;
        return { productFound: false };
      }
      if (product.status !== 'active' || product.categoryStatus !== 'active') {
        await connection.rollback();
        transactionStarted = false;
        return { productFound: true, productActive: false };
      }
      validateProduct?.({
        model: {
          rendererType: modelRows[0].rendererType,
          rendererKey: modelRows[0].rendererKey,
          modelUrl: modelRows[0].modelUrl,
          width: Number(modelRows[0].width), depth: Number(modelRows[0].depth), height: Number(modelRows[0].height),
          surfaceType: modelRows[0].surfaceType, isActive: Boolean(modelRows[0].isActive),
          productId: String(modelRows[0].productId),
        },
        product,
      });
      const { assignments, values } = buildAssignments(input, productModelFields);
      await connection.execute(`UPDATE product_3d_models SET ${assignments.join(', ')} WHERE id = ?`, [...values, id]);
      const updatedModel = await findProductModel(id, {}, connection);
      await connection.commit();
      transactionStarted = false;
      return { model: updatedModel };
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  async function removeProductModel(id) {
    const [result] = await database.execute('DELETE FROM product_3d_models WHERE id = ?', [id]);
    return { found: result.affectedRows > 0, deleted: result.affectedRows > 0 };
  }

  async function replaceRoomFurniture(id, placements, validate) {
    const connection = await database.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [roomRows] = await connection.execute(
        `SELECT CAST(id AS CHAR) AS id, name, slug, description, room_config AS roomConfig,
                is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
         FROM room_templates WHERE id = ? FOR UPDATE`,
        [id],
      );
      if (!roomRows[0]) {
        await connection.rollback();
        transactionStarted = false;
        return { found: false };
      }
      const assets = await findFurnitureAssetsByIds(placements.map((placement) => placement.furnitureAssetId), connection);
      const assetIds = new Set(assets.map((asset) => asset.id));
      const missingAssetIds = placements.map((placement) => placement.furnitureAssetId).filter((assetId) => !assetIds.has(assetId));
      const inactiveAssetIds = assets.filter((asset) => !asset.isActive).map((asset) => asset.id);
      if (missingAssetIds.length || inactiveAssetIds.length) {
        await connection.rollback();
        transactionStarted = false;
        return { found: true, missingAssetIds, inactiveAssetIds };
      }
      const room = mapRoom(roomRows[0]);
      validate?.({ room, assets });
      await connection.execute('DELETE FROM room_template_furniture WHERE room_template_id = ?', [id]);
      for (const placement of placements) {
        await connection.execute(
          `INSERT INTO room_template_furniture
             (room_template_id, furniture_asset_id, position_x, position_z, rotation, is_present, color_hex)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, placement.furnitureAssetId, placement.positionX, placement.positionZ, placement.rotation, placement.isPresent, placement.colorHex ?? null],
        );
      }
      const [savedRows] = await connection.execute(
        `SELECT CAST(rtf.room_template_id AS CHAR) AS roomTemplateId,
                CAST(fa.id AS CHAR) AS furnitureAssetId, fa.asset_code AS assetCode, fa.name,
                fa.furniture_type AS furnitureType, fa.renderer_type AS rendererType,
                fa.renderer_key AS rendererKey, fa.model_url AS modelUrl, fa.dimensions,
                rtf.position_x AS positionX, rtf.position_z AS positionZ,
                rtf.rotation, rtf.is_present AS isPresent, rtf.color_hex AS colorHex
         FROM room_template_furniture rtf JOIN furniture_assets fa ON fa.id = rtf.furniture_asset_id
         WHERE rtf.room_template_id = ? ORDER BY fa.id`,
        [id],
      );
      await connection.commit();
      transactionStarted = false;
      return {
        found: true,
        room: { ...room, furniture: savedRows.map((row) => ({
          furnitureAssetId: String(row.furnitureAssetId), assetCode: row.assetCode, name: row.name,
          furnitureType: row.furnitureType, rendererType: row.rendererType, rendererKey: row.rendererKey,
          modelUrl: row.modelUrl, dimensions: jsonValue(row.dimensions), positionX: Number(row.positionX),
          positionZ: Number(row.positionZ), rotation: Number(row.rotation), isPresent: Boolean(row.isPresent),
          colorHex: row.colorHex,
        })) },
      };
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  async function deleteWithReferenceCheck({ id, table, referenceTable, referenceColumn, extraReferences = [], database: db }) {
    const connection = await db.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE id = ? FOR UPDATE`, [id]);
      if (!rows.length) {
        await connection.rollback();
        transactionStarted = false;
        return { found: false, deleted: false };
      }
      for (const reference of [{ table: referenceTable, column: referenceColumn }, ...extraReferences]) {
        const [references] = await connection.execute(
          `SELECT 1 AS found FROM ${reference.table} WHERE ${reference.column} = ? LIMIT 1`, [id],
        );
        if (references.length) {
          await connection.rollback();
          transactionStarted = false;
          return { found: true, deleted: false, referenced: true };
        }
      }
      await connection.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
      await connection.commit();
      transactionStarted = false;
      return { found: true, deleted: true };
    } catch (error) {
      if (transactionStarted) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  return {
    createFurnitureAsset,
    createProductModel,
    createRoom,
    findFurnitureAsset,
    findFurnitureAssetsByIds,
    findProductForModel,
    findProductModel,
    findRoom,
    listFurnitureAssets,
    listProductModels,
    listRooms,
    removeFurnitureAsset,
    removeProductModel,
    removeRoom,
    replaceRoomFurniture,
    updateFurnitureAsset,
    updateProductModel,
    updateRoom,
  };
}

module.exports = { createStudioAssetsModel };
