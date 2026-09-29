function toNumeric(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value.replace(/[^0-9.-]/g, ""))
}

export function formatCurrency(
  value: string | number | null | undefined,
  emptyValue = "--"
): string {
  if (value === null || value === undefined || value === "") {
    return emptyValue
  }

  const numericValue = toNumeric(value)

  if (!Number.isFinite(numericValue)) {
    return emptyValue
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

export function formatQty(
  value: string | number | null | undefined,
  emptyValue = "--"
): string {
  if (value === null || value === undefined || value === "") {
    return emptyValue
  }

  const numericValue = toNumeric(value)

  if (!Number.isFinite(numericValue)) {
    return emptyValue
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}
