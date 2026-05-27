import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "main";
  id?: string;
}

export default function Card({ children, className = "", as: Tag = "div", id }: CardProps) {
  return (
    <Tag id={id} className={`rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(15,23,42,0.25)] ${className}`}>
      {children}
    </Tag>
  );
}
