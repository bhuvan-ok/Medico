export const buildQueryFilters = ({
  query = {},
  searchFields = [],
  allowedFilters = [],
  allowedSortFields = [],
  defaultSort = { createdAt: -1 },
  defaultLimit = 10,
  maxLimit = 50,
}) => {
  const filter = {};

  // Text search across searchFields
  if (query.search && searchFields.length) {
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: query.search, $options: 'i' },
    }));
  }

  // Allowed exact-match filters
  for (const field of allowedFilters) {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = query[field];
    }
  }

  // Range filters (minFee, maxFee → consultationFee)
  if (query.minFee || query.maxFee) {
    filter.consultationFee = {};
    if (query.minFee) filter.consultationFee.$gte = Number(query.minFee);
    if (query.maxFee) filter.consultationFee.$lte = Number(query.maxFee);
  }

  if (query.minRating) {
    filter['rating.average'] = { $gte: Number(query.minRating) };
  }

  // Sort: ?sortBy=rating.average|-1
  let sort = defaultSort;
  if (query.sortBy) {
    const [field, dir] = query.sortBy.split('|');
    if (allowedSortFields.includes(field)) {
      sort = { [field]: dir === '-1' ? -1 : 1 };
    }
  }

  // Pagination
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;

  return { filter, sort, skip, limit, page };
};
