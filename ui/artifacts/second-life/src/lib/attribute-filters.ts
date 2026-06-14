import type { AttributeResponse } from "@/api/attributes";

/** Attributes with empty subCategoryIds apply to all sub-categories. */
export function filterAttributesBySubCategory(
  attributes: AttributeResponse[],
  subCategoryId?: string | null,
): AttributeResponse[] {
  const scopedId = subCategoryId?.trim();
  return attributes.filter((attr) => {
    const scoped = attr.subCategoryIds;
    if (!scoped?.length) {
      return true;
    }
    if (!scopedId) {
      return false;
    }
    return scoped.includes(scopedId);
  });
}

export function isPhoneSubCategory(subCategoryId?: string | null): boolean {
  return subCategoryId?.trim() === "sub-phone";
}
