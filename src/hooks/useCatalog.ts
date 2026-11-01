"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Category, Product } from "@/lib/products";

export type LoadStatus = "loading" | "ready" | "error";

/** Products + categories from the API, loaded on mount */
export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  const reload = useCallback(async () => {
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        api.listProducts(),
        api.listCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, setProducts, categories, status, reload };
}
