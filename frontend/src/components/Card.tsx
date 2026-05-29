import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Card — superficie base del tema Kritik.
 * Misma API que antes: `as` para elegir la etiqueta, `className` se fusiona
 * (puedes seguir pasando padding, id, etc.). Al migrarlo aquí, todas las
 * páginas que usan <Card> adoptan el estilo nuevo automáticamente.
 */
type CardOwnProps = {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
};

type CardProps = CardOwnProps & Omit<ComponentPropsWithoutRef<"div">, keyof CardOwnProps>;

export default function Card({ as: Tag = "div", className = "", children, ...rest }: CardProps) {
  const Component = Tag as ElementType;
  return (
    <Component
      className={`rounded-[2rem] border border-line bg-surface ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
