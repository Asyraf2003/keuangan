import { archiveCategory as archiveCategoryRepo } from '../../infra/repos/categoryRepo.js'

export async function archiveCategory(id) {
  return archiveCategoryRepo(id)
}
