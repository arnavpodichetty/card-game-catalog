// Button.tsx — the shared button. Renders an <a> when given href, else a <button>.
import type { ReactNode, MouseEventHandler } from "react";
import { Icon } from "./icons";

export interface BtnProps {
  children: ReactNode;
  kind?: "primary" | "secondary" | "join" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconRight?: string;
  onClick?: MouseEventHandler;
  href?: string;
  type?: "button" | "submit" | "reset";
  full?: boolean;
  [key: string]: any; // passthrough (disabled, style, aria-*, …)
}

export function Btn({ children, kind = "primary", size = "md", icon, iconRight, onClick, href, type, full, ...rest }: BtnProps) {
  const cls = `btn btn--${kind} btn--${size}${full ? " btn--full" : ""}`;
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === "lg" ? 22 : 18} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 22 : 18} />}
    </>
  );

  if (href !== undefined) return <a className={cls} href={href} onClick={onClick} {...rest}>{inner}</a>;
  return <button className={cls} type={type || "button"} onClick={onClick} {...rest}>{inner}</button>;
}
