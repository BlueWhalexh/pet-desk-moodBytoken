import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Single "blob" route with maxFileCount=3 catches all three files
// (zip + sprite + pet.json) without per-mime matcher confusion in UT v7.
export const ourFileRouter = {
  petPackUploader: f({
    blob: { maxFileSize: "8MB", maxFileCount: 3 },
  })
    .middleware(async () => {
      const { userId, sessionClaims } = await auth();
      if (!userId) throw new UploadThingError("Sign in to upload");
      const email =
        (sessionClaims?.email as string | undefined) ??
        (sessionClaims?.["email_addresses" as keyof typeof sessionClaims] as
          | string
          | undefined);
      return { userId, email: email ?? null };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        userId: metadata.userId,
        email: metadata.email,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
