import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Affiche un avatar (signed URL) avec bouton d'upload optionnel. */
export function AvatarUploader({
  userId,
  avatarPath,
  size = 64,
  editable = false,
  onChange,
  ringColor = "var(--ff-cyan)",
}: {
  userId: string;
  avatarPath: string | null;
  size?: number;
  editable?: boolean;
  onChange?: (path: string) => void;
  ringColor?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!avatarPath) { setUrl(null); return; }
    supabase.storage.from("avatars").createSignedUrl(avatarPath, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [avatarPath]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image trop lourde (max 5 Mo)."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) { alert(error.message); return; }
    onChange?.(path);
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="rounded-full grid place-items-center border-2 overflow-hidden"
        style={{ width: size, height: size, borderColor: ringColor, background: "var(--ff-surface-2)" }}
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="h-1/2 w-1/2" style={{ color: ringColor }} />
        )}
      </div>
      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full grid place-items-center border-2"
            style={{ background: "var(--ff-surface)", borderColor: ringColor, color: ringColor }}
            aria-label="Changer la photo"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </>
      )}
    </div>
  );
}
