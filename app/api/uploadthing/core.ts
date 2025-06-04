import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async () => {
      try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              async get(name: string) {
                const cookie = cookieStore.get(name);
                return cookie?.value;
              },
              async set(name: string, value: string, options: any) {
                cookieStore.set({ name, value, ...options });
              },
              async remove(name: string, options: any) {
                cookieStore.set({ name, value: '', ...options });
              },
            },
          }
        );
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('You must be logged in to upload images');
        }

        return { userId: user.id };
      } catch (error) {
        throw new Error('Failed to authenticate upload');
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        return { success: true, url: file.url };
      } catch (error) {
        throw new Error('Failed to process upload');
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
