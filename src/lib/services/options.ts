import type { OptionInput } from "@/lib/admin-schemas";
import {
  createOption,
  deleteOption,
  getActiveOptionsGrouped,
  getAllOptions,
  updateOption,
  type OptionsByType,
} from "@/lib/db/queries";
import type { OptionRow } from "@/lib/db/schema";

/**
 * Tầng service cho options — hiện là pass-through mỏng nhưng là chỗ duy nhất
 * để thêm rule nghiệp vụ sau này (VD: không cho xóa option đã có submission).
 * Route handler chỉ validate + điều phối, không gọi thẳng tầng data.
 */

export async function listAllOptions(): Promise<OptionRow[]> {
  return getAllOptions();
}

export async function listActiveOptionsGrouped(): Promise<OptionsByType> {
  return getActiveOptionsGrouped();
}

export async function addOption(input: OptionInput): Promise<OptionRow> {
  return createOption(input);
}

export async function editOption(id: number, input: OptionInput): Promise<OptionRow | null> {
  return updateOption(id, input);
}

export async function removeOption(id: number): Promise<boolean> {
  return deleteOption(id);
}
