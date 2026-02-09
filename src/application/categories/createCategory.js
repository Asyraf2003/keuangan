import { createCategory as createCategoryRepo } from '../../infra/repos/categoryRepo.js'
export async function createCategory({ name, type, color = null, icon = null }) {
  return createCategoryRepo({ name, type, color, icon })
}
