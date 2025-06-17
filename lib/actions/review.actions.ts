'use server';

import { SUPABASE_TABLES } from '../constants';
import { handleSupabaseError } from '../database.actions';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase-server';

export async function getReviewsByProductId(productId: string) {
  try {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
      .from(SUPABASE_TABLES.REVIEWS)
      .select('*')
      .eq('product_id', productId);

    if (error) {
      handleSupabaseError(error);
    }

    return reviews || [];
  } catch (error) {
    return [];
  }
}

export async function getReview(productId: string, userId: string) {
  try {
    const supabase = await createClient();

    const { data: review, error } = await supabase
      .from(SUPABASE_TABLES.REVIEWS)
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // If the table doesn't exist, return null instead of throwing error
      if (error.code === '42P01') {
        return null;
      }
      handleSupabaseError(error);
    }

    return review;
  } catch (error) {
    return null;
  }
}

export async function createReview(data: {
  title: string;
  comment: string;
  rating: number;
  product_id: string;
  user_id: string;
  id?: string;
}) {
  try {
    const supabase = await createClient();

    if (data.id) {
      // Update existing review
      const { error } = await supabase
        .from(SUPABASE_TABLES.REVIEWS)
        .update({
          title: data.title,
          description: data.comment,
          rating: data.rating,
        })
        .eq('id', data.id);

      if (error) {
        // If the table doesn't exist, silently skip review creation
        if (error.code === '42P01') {
          return;
        }
        handleSupabaseError(error);
      }
    } else {
      // Create new review
      const { error } = await supabase
        .from(SUPABASE_TABLES.REVIEWS)
        .insert({
          title: data.title,
          description: data.comment,
          rating: data.rating,
          product_id: data.product_id,
          user_id: data.user_id,
        });

      if (error) {
        // If the table doesn't exist, silently skip review creation
        if (error.code === '42P01') {
          return;
        }
        handleSupabaseError(error);
      }
    }

    revalidatePath(`/product/${data.product_id}`);
  } catch (error) {
    // Silently fail
  }
}
