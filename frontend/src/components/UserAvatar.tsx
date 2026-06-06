import { useState } from "react";

const SIZE_MAP = {
  xs: "h-9 w-9 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

export type AvatarSize = keyof typeof SIZE_MAP;

interface Props {
  name: string;
  image?: string | null;
  size?: AvatarSize;
}

export default function UserAvatar({ name, image, size = "md" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  if (image && !imgFailed) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setImgFailed(true)}
        className={`shrink-0 rounded-full object-cover ring-1 ring-line ${SIZE_MAP[size]}`}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-surface2 font-display font-bold text-acid ring-1 ring-line ${SIZE_MAP[size]}`}
    >
      {initial}
    </span>
  );
}
