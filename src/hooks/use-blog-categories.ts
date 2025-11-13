"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        setError("Falha ao carregar categorias.");
        setCategories([]);
      } else {
        setCategories(data as BlogCategory[]);
      }
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}