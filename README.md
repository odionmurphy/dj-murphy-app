This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Mix uploads with Cloudflare R2

Mix details remain in the Supabase `mixes` table. New audio files are uploaded
directly from the browser to R2 using short-lived, admin-only signed upload
URLs; older mix paths continue to use Supabase Storage.

Configure these server environment variables:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

Create an R2 API token with object read/write access for the mixes bucket and
set the bucket's public URL (preferably a custom domain) as `R2_PUBLIC_URL`.
Enable public reads using that domain so the site can stream the audio. Configure
the bucket CORS policy with the local app origin and production site origin:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-site.example"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The uploader supports MP3, M4A, and AAC files up to 5 GB, suitable for long
mixes.

Optional cover art can be uploaded with each mix as a JPG, PNG, or WebP image
up to 10 MB. Before using cover images, run
`supabase/migrations/20261109170000_add_mix_artwork_path.sql` in the Supabase
SQL Editor to add the `artwork_path` column to the existing `mixes` table.

Live-set videos can be uploaded separately as MP4 or WebM files up to 5 GB.
For widest desktop and phone compatibility, use MP4 with H.264 video and AAC
audio; the file extension alone does not guarantee codec support. Videos are
uploaded directly to the same R2 bucket and shown in a Live Sets section on the
Mixes page. Run
`supabase/migrations/20261111180000_add_mix_videos.sql` in the Supabase SQL
Editor before publishing the first video. The existing R2 public URL and
browser `PUT` CORS configuration are used for video uploads and playback.

Upcoming gigs can also include an optional MP4 or WebM event video, uploaded
directly to the same R2 bucket. Run
`supabase/migrations/20261111183000_add_gig_video_path.sql` in the Supabase SQL
Editor before adding gig videos. The event image remains optional and is used
as the video poster when both are provided.
# dj-murphy-app
