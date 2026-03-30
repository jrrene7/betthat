import { useRef, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Avatar from "src/components/Avatar";
import { useUser } from "src/context/UserContext";
import { trpc } from "src/utils/trpc";

export default function EditProfileModal() {
  const { user, isEditOpen, closeEdit, refetchUser } = useUser();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync fields when modal opens
  useEffect(() => {
    if (isEditOpen && user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
      setPreviewImage(null);
      setImageFile(null);
    }
  }, [isEditOpen, user]);

  const { mutateAsync: updateProfile, isLoading } =
    trpc.user.updateProfile.useMutation({
      onSuccess: () => {
        refetchUser();
        toast.success("Profile updated!");
        closeEdit();
      },
      onError: () => toast.error("Failed to update profile."),
    });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  }

  async function uploadToCloudinary(file: File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      form
    );
    return data.secure_url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadToCloudinary(imageFile);
      } catch {
        toast.error("Image upload failed.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await updateProfile({
      name: name.trim(),
      bio: bio.trim() || null,
      ...(imageUrl !== undefined && { image: imageUrl }),
    });
  }

  if (!isEditOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => e.target === e.currentTarget && closeEdit()}
    >
      <div className="w-full max-w-md rounded-xl bg-[#1a1a1a] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit profile</h2>
          <button
            onClick={closeEdit}
            className="text-gray-400 transition-colors hover:text-white"
            aria-label="Close"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                src={previewImage ?? user?.image}
                className="h-20 w-20 rounded-full"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow"
                aria-label="Change avatar"
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.465l-3.536 1.06 1.06-3.536A2 2 0 019 13z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-gray-500">JPG, PNG or GIF · max 5 MB</p>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full rounded-md border border-[#2f2f2f] bg-[#0f0f0f] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
              placeholder="Your name"
            />
            <p className="mt-1 text-right text-xs text-gray-600">{name.length}/50</p>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-md border border-[#2f2f2f] bg-[#0f0f0f] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
              placeholder="Tell people about yourself"
            />
            <p className="mt-1 text-right text-xs text-gray-600">{bio.length}/200</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closeEdit}
              className="flex-1 rounded-md border border-[#2f2f2f] py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#2f2f2f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || uploading}
              className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {uploading ? "Uploading..." : isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
