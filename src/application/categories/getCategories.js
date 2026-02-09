import { listCategories } from '../../infra/repos/categoryRepo.js'

export async function getCategories({ includeArchived = false } = {}) {
  const items = await listCategories({ includeArchived })
  return { items }
}
